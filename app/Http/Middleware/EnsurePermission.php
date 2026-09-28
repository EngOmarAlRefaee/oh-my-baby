<?php

namespace App\Http\Middleware;

use App\Support\PermissionCatalog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect('/account');
        }

        foreach ($permissions as $permission) {
            if (PermissionCatalog::has($user, $permission)) {
                return $next($request);
            }
        }

        // APIs still return a real 403 so the backend remains securely enforced.
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // For normal browser pages, do not show an ugly permission error page.
        // Send the user quietly back to their own workspace instead.
        return redirect($this->homeForRole((string) $user->role));
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
