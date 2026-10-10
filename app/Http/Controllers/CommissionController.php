<?php

namespace App\Http\Controllers;

use App\Models\CommissionSettlementRequest;
use App\Models\CommissionShare;
use App\Models\CommissionTransfer;
use App\Models\FinancialLedgerEntry;
use App\Models\FinancialSettlement;
use App\Models\User;
use App\Services\CommissionService;
use App\Services\FinancialLedgerService;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommissionController extends Controller
{
    /** Owner-only finance control center. */
    public function index(Request $request, FinancialLedgerService $ledger): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor?->role === 'owner', 403);

        $accounts = User::query()
            ->where('role', 'admin')
            ->orderByDesc('is_primary_admin')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'role', 'account_status', 'is_primary_admin']);

        $accountsPayload = $accounts->map(function (User $account) use ($ledger) {
            $balance = $ledger->balanceFor($account);
            $due = max(0, -$balance);
            $pendingClaim = CommissionSettlementRequest::query()
                ->where('account_user_id', $account->id)
                ->where('status', 'pending')
                ->latest('id')
                ->first();

            return [
                'id' => $account->id,
                'name' => $account->name,
                'email' => $account->email,
                'phone' => $account->phone,
                'account_status' => $account->account_status,
                'is_primary_admin' => (bool) $account->is_primary_admin,
                'balance_usd' => round($balance, 4),
                'amount_due_usd' => round($due, 4),
                'credit_usd' => round(max(0, $balance), 4),
                'total_collected_usd' => round((float) FinancialSettlement::query()
                    ->where('account_user_id', $account->id)
                    ->where('status', 'confirmed')
                    ->sum('amount_usd'), 4),
                'open_commissions_count' => CommissionShare::where('admin_user_id', $account->id)
                    ->whereIn('status', ['pending', 'partially_paid'])
                    ->count()
                    + CommissionTransfer::where('debtor_user_id', $account->id)
                        ->whereDoesntHave('shares')
                        ->whereIn('status', ['pending', 'partially_paid'])
                        ->count(),
                'pending_claim' => $pendingClaim ? [
                    'id' => $pendingClaim->id,
                    'amount_usd' => (float) $pendingClaim->amount_usd,
                    'submitted_at' => $pendingClaim->submitted_at,
                ] : null,
            ];
        })->values();

        $visibleAccountIds = $accounts->pluck('id');

        $entries = FinancialLedgerEntry::query()
            ->with([
                'account:id,name,email,phone',
                'order:id,reference,status,total_usd,delivered_at,customer_confirmed_at',
                'commission:id,order_id,type,status,amount_usd',
                'commissionShare:id,commission_transfer_id,order_id,admin_user_id,amount_usd,paid_usd,status',
                'settlement:id,account_user_id,amount_usd,provider_transaction_id,orders_count,confirmed_at',
            ])
            ->whereIn('account_user_id', $visibleAccountIds)
            ->latest('id')
            ->limit(300)
            ->get();

        $settlements = FinancialSettlement::query()
            ->with(['account:id,name,email,phone', 'confirmedBy:id,name'])
            ->whereIn('account_user_id', $visibleAccountIds)
            ->latest('id')
            ->limit(100)
            ->get();

        $pendingClaims = CommissionSettlementRequest::query()
            ->with('account:id,name,email,phone')
            ->where('status', 'pending')
            ->oldest('submitted_at')
            ->get()
            ->map(fn (CommissionSettlementRequest $claim) => [
                'id' => $claim->id,
                'account_user_id' => $claim->account_user_id,
                'account' => $claim->account,
                'amount_usd' => (float) $claim->amount_usd,
                'week_key' => $claim->week_key,
                'admin_note' => $claim->admin_note,
                'submitted_at' => $claim->submitted_at,
                'current_due_usd' => $ledger->dueFor($claim->account_user_id),
            ])
            ->values();

        $totalDue = round((float) $accountsPayload->sum('amount_due_usd'), 4);
        $netBalance = round((float) $accountsPayload->sum('balance_usd'), 4);

        return response()->json([
            'accounts' => $accountsPayload,
            'entries' => $entries,
            'settlements' => $settlements,
            'pending_claims' => $pendingClaims,
            'summary' => [
                'total_due_usd' => $totalDue,
                'net_balance_usd' => $netBalance,
                'accounts_in_debt' => $accountsPayload->where('amount_due_usd', '>', 0)->count(),
                'confirmed_settlements_usd' => round((float) FinancialSettlement::query()
                    ->whereIn('account_user_id', $visibleAccountIds)
                    ->where('status', 'confirmed')
                    ->sum('amount_usd'), 4),
                'pending_claims_count' => $pendingClaims->count(),
                'deferred_decoration_count' => CommissionTransfer::where('status', 'deferred')->count(),
                'unassigned_commissions_count' => CommissionTransfer::where('status', 'unassigned')->count(),
            ],
            'can_record_settlement' => true,
            'integration' => [
                'sham_cash_enabled' => (bool) config('ohmybaby.sham_cash.enabled'),
                'automatic_transfer_active' => false,
                'status' => 'deferred',
            ],
        ]);
    }

    /** Admin sees only the current debt, current order shares and unresolved claim. */
    public function myCommissions(Request $request, FinancialLedgerService $ledger): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor?->role === 'admin', 403);
        abort_unless(PermissionCatalog::has($actor, 'commissions.self.view'), 403);

        $due = $ledger->dueFor($actor);
        $canViewOrders = PermissionCatalog::has($actor, 'commissions.self.orders');
        $canClaim = PermissionCatalog::has($actor, 'commissions.self.claim');
        $window = $this->claimWindow();

        $latestClaim = CommissionSettlementRequest::query()
            ->where('account_user_id', $actor->id)
            ->latest('id')
            ->first();

        $activeClaim = null;
        if ($latestClaim && in_array($latestClaim->status, ['pending', 'rejected'], true)) {
            $activeClaim = [
                'id' => $latestClaim->id,
                'status' => $latestClaim->status,
                'amount_usd' => (float) $latestClaim->amount_usd,
                'owner_note' => $latestClaim->status === 'rejected' ? $latestClaim->owner_note : null,
                'submitted_at' => $latestClaim->submitted_at,
                'resolved_at' => $latestClaim->resolved_at,
            ];
        }

        $orderShares = collect();
        if ($canViewOrders) {
            $orderShares = CommissionShare::query()
                ->with(['order:id,reference,status,delivered_at,customer_confirmed_at', 'commission:id,status,type'])
                ->where('admin_user_id', $actor->id)
                ->whereIn('status', ['pending', 'partially_paid'])
                ->latest('id')
                ->get()
                ->reject(fn (CommissionShare $share) => in_array($share->commission?->status, ['reversed', 'excluded', 'deferred'], true))
                ->map(function (CommissionShare $share) {
                    $remaining = max(0, (float) $share->amount_usd - (float) $share->paid_usd);
                    return [
                        'id' => $share->id,
                        'order_id' => $share->order_id,
                        'order_reference' => $share->order?->reference,
                        'order_status' => $share->order?->status,
                        'share_usd' => (float) $share->amount_usd,
                        'remaining_usd' => round($remaining, 4),
                        'created_at' => $share->created_at,
                    ];
                })
                ->filter(fn (array $row) => $row['remaining_usd'] > 0.0001)
                ->values();
        }

        return response()->json([
            'account' => [
                'id' => $actor->id,
                'name' => $actor->name,
            ],
            'amount_due_usd' => round($due, 4),
            'open_orders_count' => $orderShares->count(),
            'order_shares' => $orderShares,
            'can_view_orders' => $canViewOrders,
            'can_claim_transfer' => $canClaim,
            'claim_window' => $window,
            'active_claim' => $activeClaim,
            // Intentionally no historical settlements/paid totals for Admin.
        ]);
    }

    public function submitSettlementClaim(Request $request, FinancialLedgerService $ledger): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor?->role === 'admin', 403);
        abort_unless(PermissionCatalog::has($actor, 'commissions.self.claim'), 403);

        $window = $this->claimWindow();
        if (! $window['open']) {
            throw ValidationException::withMessages([
                'settlement' => ['إرسال تأكيد التحويل متاح يوم الجمعة فقط.'],
            ]);
        }

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $pending = CommissionSettlementRequest::query()
            ->where('account_user_id', $actor->id)
            ->where('status', 'pending')
            ->exists();

        if ($pending) {
            throw ValidationException::withMessages([
                'settlement' => ['يوجد تحويل بانتظار تأكيد الأونر بالفعل.'],
            ]);
        }

        $due = $ledger->dueFor($actor);
        if ($due <= 0.0001) {
            throw ValidationException::withMessages([
                'settlement' => ['لا يوجد مبلغ مستحق عليك حالياً.'],
            ]);
        }

        $now = now();
        $claim = CommissionSettlementRequest::create([
            'account_user_id' => $actor->id,
            'amount_usd' => round($due, 4),
            'week_key' => $now->format('o-\\WW'),
            'status' => 'pending',
            'admin_note' => $data['note'] ?? null,
            'submitted_at' => $now,
        ]);

        return response()->json([
            'message' => 'تم إرسال تأكيد التحويل للأونر. لن ينخفض المستحق حتى يؤكد الاستلام.',
            'claim' => $claim,
        ], 201);
    }

    public function confirmSettlementClaim(
        Request $request,
        CommissionSettlementRequest $claim,
        FinancialLedgerService $ledger
    ): JsonResponse {
        $actor = $request->user();
        abort_unless($actor?->role === 'owner', 403);

        $data = $request->validate([
            'provider_transaction_id' => ['nullable', 'string', 'max:190'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $settlement = DB::transaction(function () use ($claim, $ledger, $actor, $data) {
            $locked = CommissionSettlementRequest::query()->lockForUpdate()->findOrFail($claim->id);
            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages(['claim' => ['تمت معالجة هذا الطلب مسبقاً.']]);
            }

            $account = User::query()->lockForUpdate()->findOrFail($locked->account_user_id);
            $currentDue = $ledger->dueFor($account);
            $requested = round((float) $locked->amount_usd, 4);

            if ($currentDue + 0.001 < $requested) {
                throw ValidationException::withMessages([
                    'claim' => ['تغير المستحق الحالي وأصبح أقل من مبلغ التحويل المبلغ عنه. ارفض الطلب واطلب من الأدمن إعادة الإرسال.'],
                ]);
            }

            $settlement = $ledger->recordSettlement(
                $account,
                $actor,
                $requested,
                $data['provider_transaction_id'] ?? null,
                $data['note'] ?? 'Confirmed from weekly Admin transfer claim',
            );

            $locked->update([
                'status' => 'confirmed',
                'resolved_by_user_id' => $actor->id,
                'financial_settlement_id' => $settlement->id,
                'owner_note' => $data['note'] ?? null,
                'resolved_at' => now(),
            ]);

            return $settlement;
        });

        return response()->json([
            'message' => 'تم تأكيد وصول التحويل وتصفير المبلغ الذي تم تسديده من رصيد الأدمن.',
            'settlement' => $settlement,
        ]);
    }

    public function rejectSettlementClaim(Request $request, CommissionSettlementRequest $claim): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor?->role === 'owner', 403);

        $data = $request->validate([
            'note' => ['required', 'string', 'min:2', 'max:2000'],
        ]);

        $updated = DB::transaction(function () use ($claim, $actor, $data) {
            $locked = CommissionSettlementRequest::query()->lockForUpdate()->findOrFail($claim->id);
            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages(['claim' => ['تمت معالجة هذا الطلب مسبقاً.']]);
            }

            $locked->update([
                'status' => 'rejected',
                'resolved_by_user_id' => $actor->id,
                'owner_note' => $data['note'],
                'resolved_at' => now(),
            ]);

            return $locked->fresh();
        });

        return response()->json([
            'message' => 'تم إبلاغ الأدمن أن التحويل لم يصل، وبقي المستحق كما هو.',
            'claim' => $updated,
        ]);
    }

    public function recordSettlement(Request $request, User $account, FinancialLedgerService $ledger): JsonResponse
    {
        abort_unless($request->user()?->role === 'owner', 403);

        $data = $request->validate([
            'amount_usd' => ['required', 'numeric', 'min:0.0001', 'max:1000000'],
            'provider_transaction_id' => ['nullable', 'string', 'max:190'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $settlement = $ledger->recordSettlement(
            $account,
            $request->user(),
            (float) $data['amount_usd'],
            $data['provider_transaction_id'] ?? null,
            $data['note'] ?? null,
        );

        return response()->json([
            'message' => 'تم تسجيل التسديد وتحديث الرصيد.',
            'settlement' => $settlement,
            'balance_usd' => $ledger->balanceFor($account),
            'amount_due_usd' => $ledger->dueFor($account),
        ], 201);
    }

    // Kept for later Sham Cash activation. The current UI does not call it.
    public function transfer(Request $request, CommissionTransfer $commission, CommissionService $service): JsonResponse
    {
        abort_unless($request->user()?->role === 'owner', 403);
        $data = $request->validate(['pin' => ['nullable', 'string', 'max:80']]);
        $updated = $service->attemptTransfer($commission, $data['pin'] ?? null);
        return response()->json(['commission' => $updated, 'ok' => $updated->status === 'paid']);
    }

    /** @return array{open: bool, is_friday: bool, local_testing_override: bool, next_friday: string} */
    private function claimWindow(): array
    {
        $now = now()->timezone(config('app.timezone', 'UTC'));
        $isFriday = $now->isFriday();
        $localOverride = app()->environment(['local', 'testing']);
        $nextFriday = $isFriday ? $now->copy() : $now->copy()->next(5);

        return [
            'open' => $isFriday || $localOverride,
            'is_friday' => $isFriday,
            'local_testing_override' => $localOverride,
            'next_friday' => $nextFriday->toDateString(),
        ];
    }
}
