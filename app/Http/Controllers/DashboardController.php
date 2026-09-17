<?php

namespace App\Http\Controllers;

use App\Models\CommissionTransfer;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\OwnerRequest;
use App\Models\SiteVisit;
use App\Models\StaffActionLog;
use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && in_array($user->role, ['owner', 'admin'], true), 403);

        $effectivePermissions = PermissionCatalog::effectiveFor($user);
        $can = fn (string $permission): bool => PermissionCatalog::has($user, $permission);

        $today = now()->startOfDay();
        $month = now()->startOfMonth();

        $canViewOrders = $can('orders.view');
        $canViewAnalytics = $can('analytics.view');

        $statusCounts = $canViewOrders
            ? Order::query()->selectRaw('status, COUNT(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status')
            : collect();

        $base = [
            'role' => $user->role,
            'permissions' => $effectivePermissions,
            'user' => [...$user->only(['id', 'name', 'email', 'phone', 'role']), 'is_primary_admin' => (bool) $user->is_primary_admin],
            'orders' => [
                'today' => $canViewOrders ? Order::where('created_at', '>=', $today)->count() : 0,
                'pending_review' => (int) ($statusCounts['pending_review'] ?? 0),
                'accepted' => (int) ($statusCounts['accepted'] ?? 0),
                'assigned_to_driver' => (int) ($statusCounts['assigned_to_driver'] ?? 0),
                'out_for_delivery' => (int) ($statusCounts['out_for_delivery'] ?? 0),
                'delivered_today' => $canViewOrders ? Order::where('status', 'delivered')->where('delivered_at', '>=', $today)->count() : 0,
                'delivered_total' => $canViewOrders ? Order::where('status', 'delivered')->count() : 0,
                'rejected_today' => $canViewOrders ? Order::where('status', 'rejected')->where('updated_at', '>=', $today)->count() : 0,
                'returned_total' => $canViewOrders ? Order::where('status', 'returned')->count() : 0,
                'return_requested' => (int) ($statusCounts['return_requested'] ?? 0),
                'return_in_transit' => (int) ($statusCounts['return_in_transit'] ?? 0),
                'direct_returns_total' => $canViewAnalytics ? OrderEvent::where('event', 'delivery_failed_return_started')->count() : 0,
                'post_delivery_return_requests_total' => $canViewAnalytics ? OrderEvent::where('event', 'return_requested')->count() : 0,
            ],
            'sales' => [
                'delivered_today_usd' => $canViewAnalytics ? (float) Order::where('status', 'delivered')->where('delivered_at', '>=', $today)->sum('total_usd') : 0.0,
                'delivered_month_usd' => $canViewAnalytics ? (float) Order::where('status', 'delivered')->where('delivered_at', '>=', $month)->sum('total_usd') : 0.0,
            ],
            'people' => [
                'customers' => $can('team.view') ? User::where('role', 'customer')->count() : 0,
                'drivers' => $can('team.view') ? User::where('role', 'delivery')->count() : 0,
                'admins' => $can('team.view') ? User::where('role', 'admin')->count() : 0,
            ],
            'analytics' => [
                'unique_visits_today' => $canViewAnalytics ? SiteVisit::where('visited_at', '>=', $today)->distinct('session_key')->count('session_key') : 0,
                'pageviews_today' => $canViewAnalytics ? SiteVisit::where('visited_at', '>=', $today)->count() : 0,
                'logins_today' => $canViewAnalytics ? StaffActionLog::where('action', 'login')->where('created_at', '>=', $today)->count() : 0,
                'logins_month' => $canViewAnalytics ? StaffActionLog::where('action', 'login')->where('created_at', '>=', $month)->count() : 0,
            ],
            'recent_orders' => $can('orders.view')
                ? Order::with(['deliveryUser:id,name'])
                    ->latest()
                    ->limit(6)
                    ->get(['id', 'reference', 'customer_name', 'status', 'total_usd', 'total_syp', 'assigned_delivery_id', 'created_at'])
                : [],
            'sham_cash' => [
                'enabled' => $can('finance.view') ? (bool) config('ohmybaby.sham_cash.enabled') : false,
                'auto_transfer' => $can('finance.view') ? (bool) config('ohmybaby.sham_cash.auto_transfer') : false,
                'company_account' => $can('finance.view') ? $this->maskAccount((string) config('ohmybaby.sham_cash.company_account')) : null,
                'company_account_configured' => $can('finance.view') && filled(config('ohmybaby.sham_cash.company_account')),
            ],
            'owner_requests' => [
                'pending_mine' => $can('owner_requests.manage')
                    ? ($user->role === 'admin'
                        ? OwnerRequest::where('admin_id', $user->id)->where('status', 'pending')->count()
                        : OwnerRequest::where('status', 'pending')->count())
                    : 0,
            ],
        ];

        if ($user->role === 'owner') {
            $base['commissions'] = [
                'pending_usd' => (float) CommissionTransfer::where('status', 'pending')->sum('amount_usd'),
                'paid_usd' => (float) CommissionTransfer::where('status', 'paid')->sum('amount_usd'),
                'failed_count' => CommissionTransfer::where('status', 'failed')->count(),
            ];
        } else {
            $base['commissions'] = [
                'pending_usd' => $can('finance.view') ? (float) CommissionTransfer::where('status', 'pending')->sum('amount_usd') : 0.0,
                'pending_count' => $can('finance.view') ? CommissionTransfer::where('status', 'pending')->count() : 0,
            ];
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
