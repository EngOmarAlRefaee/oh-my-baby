<?php

namespace App\Http\Controllers;

use App\Models\CommissionTransfer;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && in_array($user->role, ['owner', 'admin'], true), 403);

        $today = now()->startOfDay();
        $month = now()->startOfMonth();

        $statusCounts = Order::query()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $base = [
            'role' => $user->role,
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role']),
            'orders' => [
                'today' => Order::where('created_at', '>=', $today)->count(),
                'pending_review' => (int) ($statusCounts['pending_review'] ?? 0),
                'accepted' => (int) ($statusCounts['accepted'] ?? 0),
                'assigned_to_driver' => (int) ($statusCounts['assigned_to_driver'] ?? 0),
                'out_for_delivery' => (int) ($statusCounts['out_for_delivery'] ?? 0),
                'delivered_today' => Order::where('status', 'delivered')->where('delivered_at', '>=', $today)->count(),
                'rejected_today' => Order::where('status', 'rejected')->where('updated_at', '>=', $today)->count(),
            ],
            'sales' => [
                'delivered_today_usd' => (float) Order::where('status', 'delivered')->where('delivered_at', '>=', $today)->sum('total_usd'),
                'delivered_month_usd' => (float) Order::where('status', 'delivered')->where('delivered_at', '>=', $month)->sum('total_usd'),
            ],
            'people' => [
                'customers' => User::where('role', 'customer')->count(),
                'drivers' => User::where('role', 'delivery')->count(),
                'admins' => User::where('role', 'admin')->count(),
            ],
            'recent_orders' => Order::with(['deliveryUser:id,name'])
                ->latest()
                ->limit(6)
                ->get(['id', 'reference', 'customer_name', 'status', 'total_usd', 'total_syp', 'assigned_delivery_id', 'created_at']),
            'sham_cash' => [
                'enabled' => (bool) config('ohmybaby.sham_cash.enabled'),
                'auto_transfer' => (bool) config('ohmybaby.sham_cash.auto_transfer'),
                'company_account' => $this->maskAccount((string) config('ohmybaby.sham_cash.company_account')),
                'company_account_configured' => filled(config('ohmybaby.sham_cash.company_account')),
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
                'pending_usd' => (float) CommissionTransfer::where('status', 'pending')->sum('amount_usd'),
                'pending_count' => CommissionTransfer::where('status', 'pending')->count(),
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
