<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect('/account');
        }

        if (! in_array($user->role, $roles, true)) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }

            return redirect($this->homeForRole((string) $user->role));
        }

        return $next($request);
    }

    private function homeForRole(string $role): string
    {
        return match ($role) {
            'owner' => '/owner',
            'admin' => '/admin',
            'delivery' => '/delivery',
            default => '/account',
        };
    }
}
