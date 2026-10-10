<?php

namespace App\Http\Controllers;

use App\Models\CommissionShare;
use App\Models\CommissionTransfer;
use App\Models\FinancialLedgerEntry;
use App\Models\FinancialSettlement;
use App\Models\Order;
use App\Models\User;
use App\Support\DataScope;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && in_array($user->role, ['owner', 'admin'], true), 403);
        abort_unless(PermissionCatalog::has($user, 'analytics.view'), 403);

        $today = now()->startOfDay();
        $month = now()->startOfMonth();

        $orderScope = DataScope::applyOrders(Order::query(), $user);
        $statusCounts = (clone $orderScope)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $base = [
            'role' => $user->role,
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role']),
            'orders' => [
                'today' => (clone $orderScope)->where('created_at', '>=', $today)->count(),
                'pending_review' => (int) ($statusCounts['pending_review'] ?? 0),
                'accepted' => (int) ($statusCounts['accepted'] ?? 0),
                'assigned_to_driver' => (int) ($statusCounts['assigned_to_driver'] ?? 0),
                'out_for_delivery' => (int) ($statusCounts['out_for_delivery'] ?? 0),
                'delivered_today' => (clone $orderScope)->where('status', 'delivered')->where('delivered_at', '>=', $today)->count(),
                'rejected_today' => (clone $orderScope)->where('status', 'rejected')->where('updated_at', '>=', $today)->count(),
            ],
            'sales' => [
                'delivered_today_usd' => (float) (clone $orderScope)->where('status', 'delivered')->where('delivered_at', '>=', $today)->sum('total_usd'),
                'delivered_month_usd' => (float) (clone $orderScope)->where('status', 'delivered')->where('delivered_at', '>=', $month)->sum('total_usd'),
            ],
        ];

        $base['recent_orders'] = PermissionCatalog::has($user, 'orders.view')
            ? DataScope::applyOrders(Order::with(['deliveryUser:id,name']), $user)
                ->latest()
                ->limit(6)
                ->get(['id', 'reference', 'customer_name', 'status', 'total_usd', 'total_syp', 'assigned_delivery_id', 'created_at'])
            : [];

        $base['people'] = PermissionCatalog::has($user, 'team.view')
            ? [
                'customers' => User::where('role', 'customer')->count(),
                'drivers' => User::where('role', 'delivery')->count(),
                'admins' => User::where('role', 'admin')->count(),
            ]
            : null;

        if (PermissionCatalog::has($user, 'finance.view')) {
            $base['sham_cash'] = [
                'enabled' => (bool) config('ohmybaby.sham_cash.enabled'),
                'auto_transfer' => (bool) config('ohmybaby.sham_cash.auto_transfer'),
                'company_account' => $this->maskAccount((string) config('ohmybaby.sham_cash.company_account')),
                'company_account_configured' => filled(config('ohmybaby.sham_cash.company_account')),
            ];

            if ($user->role === 'owner') {
                $balances = FinancialLedgerEntry::query()
                    ->selectRaw('account_user_id, SUM(amount_usd) as balance')
                    ->groupBy('account_user_id')
                    ->get();

                $base['commissions'] = [
                    'pending_usd' => round((float) $balances->sum(fn ($row) => max(0, -(float) $row->balance)), 4),
                    'paid_usd' => (float) FinancialSettlement::where('status', 'confirmed')->sum('amount_usd'),
                    'failed_count' => 0,
                ];
            } else {
                $balance = (float) FinancialLedgerEntry::where('account_user_id', $user->id)->sum('amount_usd');
                $base['commissions'] = [
                    'pending_usd' => round(max(0, -$balance), 4),
                    'pending_count' => CommissionShare::where('admin_user_id', $user->id)
                        ->whereIn('status', ['pending', 'partially_paid'])
                        ->count()
                        + CommissionTransfer::where('debtor_user_id', $user->id)
                            ->whereDoesntHave('shares')
                            ->whereIn('status', ['pending', 'partially_paid'])
                            ->count(),
                ];
            }
        } else {
            $base['sham_cash'] = null;
            $base['commissions'] = null;
        }

        return response()->json($base);
    }

    private function maskAccount(string $account): ?string
    {
        if ($account === '') return null;
        if (strlen($account) <= 8) return $account;
        return substr($account, 0, 4).'••••'.substr($account, -4);
    }
}


