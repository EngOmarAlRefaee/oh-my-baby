<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Support\CommissionLock;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->account_status ?? 'active') !== 'active') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'This account is suspended. Contact the store owner.',
                    'code' => 'account_suspended',
                ], 403);
            }

            return redirect('/?account=suspended');
        }

        // Weekly commission lock: an Admin with unpaid debt from past weeks can only
        // reach the dues page until the Owner confirms the payment.
        if ($user && $user->role === 'admin'
            && ($request->is('api/admin/*') || $request->is('api/support/staff*') || $request->is('api/delivery*')
                || $request->is('admin') || $request->is('admin/*') || $request->is('delivery*'))
            && ! $request->is('api/admin/my-commissions*') && ! $request->is('admin/operations*')
            && CommissionLock::isLocked($user)) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'حسابك مقفل مؤقتاً حتى تسدد العمولة المستحقة ويؤكد الأونر الاستلام.',
                    'code' => 'commission_locked',
                ], 423);
            }
            return redirect('/admin/operations');
        }

        return $next($request);
    }
}
