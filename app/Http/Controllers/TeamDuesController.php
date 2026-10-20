<?php

namespace App\Http\Controllers;

use App\Models\CommissionSettlementRequest;
use App\Models\User;
use App\Services\FinancialLedgerService;
use App\Services\ShamCashService;
use App\Support\CommissionLock;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/** Primary-admin screen: every Admin's due, one transfer to the owner. */
class TeamDuesController extends Controller
{
    /** Access is a permission the Owner grants, not a hard-coded role. */
    private function authorizePrimary(Request $request, string $permission = 'commissions.team.view'): User
    {
        $actor = $request->user();
        abort_unless($actor?->role === 'admin' && PermissionCatalog::has($actor, $permission), 403);
        return $actor;
    }

    private function rows(FinancialLedgerService $ledger, ?array $ids = null): array
    {
        $query = User::query()->where('role', 'admin')->where('account_status', 'active')->orderBy('name');
        if ($ids) $query->whereIn('id', $ids);

        return $query->get(['id', 'name', 'email'])->map(function (User $u) use ($ledger) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'due_usd' => $ledger->dueFor($u),
                'overdue_usd' => CommissionLock::overdueUsd($u),
                'pending_claim' => CommissionSettlementRequest::where('account_user_id', $u->id)->where('status', 'pending')->exists(),
            ];
        })->all();
    }

    public function index(Request $request, FinancialLedgerService $ledger, ShamCashService $sham): JsonResponse
    {
        $this->authorizePrimary($request);
        $rows = $this->rows($ledger);
        $recipient = (string) config('ohmybaby.sham_cash.commission_recipient');

        return response()->json([
            'admins' => $rows,
            'total_due_usd' => round(array_sum(array_column($rows, 'due_usd')), 4),
            'sham_ready' => $sham->configured(),
            'can_transfer' => PermissionCatalog::has($request->user(), 'commissions.team.transfer'),
            'recipient_hint' => $recipient !== '' ? '••••'.substr($recipient, -4) : null,
        ]);
    }

    public function transfer(Request $request, FinancialLedgerService $ledger, ShamCashService $sham): JsonResponse
    {
        $actor = $this->authorizePrimary($request, 'commissions.team.transfer');
        $data = $request->validate([
            'admin_ids' => ['nullable', 'array'],
            'admin_ids.*' => ['integer'],
            'confirm' => ['accepted'],
            'pin' => ['nullable', 'string', 'max:80'],
        ]);

        if (! $sham->configured()) {
            return response()->json(['message' => 'حساب شام كاش غير مربوط بعد. استخدم "حوّلت خارج النظام".'], 409);
        }

        $lock = Cache::lock('team-dues-transfer', 90);
        if (! $lock->get()) {
            return response()->json(['message' => 'يوجد تحويل قيد التنفيذ، انتظر قليلاً.'], 409);
        }

        try {
            $rows = array_values(array_filter($this->rows($ledger, $data['admin_ids'] ?? null), fn ($r) => $r['due_usd'] > 0.0001));
            if (! $rows) {
                return response()->json(['message' => 'لا يوجد مستحق للتحويل.'], 422);
            }

            $exact = array_sum(array_column($rows, 'due_usd'));
            $amount = ceil($exact * 100) / 100; // Sham Cash accepts cents; never pay less than the dues.

            try {
                $response = $sham->transferAmount($amount, 'OH MY BABY weekly commissions', $data['pin'] ?? null);
            } catch (\Throwable $e) {
                Log::warning('team-dues sham transfer failed', ['actor' => $actor->id, 'error' => $e->getMessage()]);
                return response()->json(['message' => 'فشل التحويل ولم يُخصم شي: '.$e->getMessage()], 502);
            }

            $txId = (string) (data_get($response, 'data.tran_id') ?? '');
            Log::info('team-dues sham transfer ok', ['actor' => $actor->id, 'amount' => $amount, 'tran_id' => $txId]);

            $failed = [];
            foreach ($rows as $row) {
                try {
                    $admin = User::findOrFail($row['id']);
                    $ledger->recordSettlement($admin, $actor, $row['due_usd'], $txId ?: null, 'Paid by primary admin via Sham Cash');
                    CommissionSettlementRequest::where('account_user_id', $admin->id)->where('status', 'pending')->update([
                        'status' => 'confirmed', 'resolved_by_user_id' => $actor->id, 'resolved_at' => now(),
                        'owner_note' => 'Settled by primary admin Sham Cash transfer '.$txId,
                    ]);
                } catch (\Throwable $e) {
                    $failed[] = $row['name'];
                    Log::critical('team-dues settlement not recorded after real transfer', ['admin' => $row['id'], 'tran_id' => $txId, 'error' => $e->getMessage()]);
                }
            }

            return response()->json([
                'message' => $failed ? 'تم التحويل لكن تعذر تسجيل التسوية لـ: '.implode('، ', $failed).' (رقم العملية '.$txId.'). سجّلها يدوياً عند الأونر.' : 'تم التحويل للأونر وتصفير المستحقات.',
                'amount_usd' => $amount,
                'transaction_id' => $txId ?: null,
                'failed' => $failed,
            ], $failed ? 207 : 200);
        } finally {
            $lock->release();
        }
    }

    /** Transfer was made outside the system: create the usual owner-approval claims. */
    public function externalClaim(Request $request, FinancialLedgerService $ledger): JsonResponse
    {
        $actor = $this->authorizePrimary($request, 'commissions.team.transfer');
        $data = $request->validate([
            'admin_ids' => ['nullable', 'array'],
            'admin_ids.*' => ['integer'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $count = 0;
        foreach ($this->rows($ledger, $data['admin_ids'] ?? null) as $row) {
            if ($row['due_usd'] <= 0.0001 || $row['pending_claim']) continue;
            CommissionSettlementRequest::create([
                'account_user_id' => $row['id'],
                'amount_usd' => round($row['due_usd'], 4),
                'week_key' => now()->format('o-\\WW'),
                'status' => 'pending',
                'admin_note' => trim(($data['note'] ?? '').' (حوّل الأدمن الرئيسي خارج النظام)'),
                'submitted_at' => now(),
            ]);
            $count++;
        }

        return response()->json(['message' => $count ? "تم إرسال $count طلب تأكيد للأونر." : 'لا يوجد ما يُرسل.', 'count' => $count]);
    }
}
