<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffWorkspace
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ($user->account_status ?? 'active') !== 'active') {
            return $next($request);
        }

        // The Owner can decide per staff account whether the public storefront is available.
        // Dashboard-only staff stay inside their dedicated workspace; storefront-enabled staff browse normally.
        if ((bool) ($user->storefront_access ?? false)) {
            return $next($request);
        }

        return match ((string) $user->role) {
            'admin' => redirect('/admin'),
            'delivery' => redirect('/delivery'),
            default => $next($request),
        };
    }
}
