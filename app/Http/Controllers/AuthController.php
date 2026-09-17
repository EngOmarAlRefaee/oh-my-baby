<?php

namespace App\Http\Controllers;

use App\Models\StaffActionLog;
use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function session(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'authenticated' => (bool) $user,
            'user' => $user ? $this->safeUser($user) : null,
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 422);
        }

        $user = $request->user();

        if (($user->account_status ?? 'active') !== 'active') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'This account is suspended. Contact the store owner.',
                'code' => 'account_suspended',
            ], 403);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
        StaffActionLog::create([
            'actor_user_id' => $user->id,
            'target_user_id' => $user->id,
            'action' => 'login',
            'note' => 'Successful password login.',
            'meta' => ['role' => $user->role],
        ]);

        return response()->json([
            'message' => 'Signed in.',
            'user' => $this->safeUser($user),
            'redirect' => $this->dashboardForRole($user->role),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:40'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
            'role' => 'customer',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Account created.',
            'user' => $this->safeUser($user),
            'redirect' => $this->dashboardForRole($user->role),
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    private function dashboardForRole(string $role): string
    {
        return match ($role) {
            'owner' => '/owner',
            'admin' => '/admin',
            'delivery' => '/delivery',
            default => '/account',
        };
    }

    private function safeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'is_primary_admin' => (bool) $user->is_primary_admin,
            'permissions' => is_array($user->permissions) ? $user->permissions : [],
            'effective_permissions' => PermissionCatalog::effectiveFor($user),
            'account_status' => $user->account_status ?? 'active',
            'avatar_url' => $user->avatar_url,
            'google_connected' => filled($user->google_id),
        ];
    }
}
