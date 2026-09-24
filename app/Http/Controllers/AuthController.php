<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
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
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:40'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $user = User::where('phone', $this->normalizePhone($data['phone']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'رقم الهاتف أو كلمة المرور غير صحيحة.',
            ], 422);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

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
            'phone' => [
                'required',
                'string',
                'max:40',
                Rule::unique('users', 'phone'),
            ],
            'email' => [
                'nullable',
                'email',
                'max:180',
                Rule::unique('users', 'email'),
            ],
            'password' => ['required', 'confirmed', Password::min(8)],
            'marketing_opt_in' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'الاسم مطلوب.',
            'phone.required' => 'رقم الهاتف مطلوب.',
            'phone.unique' => 'رقم الهاتف مستخدم من قبل.',
            'email.email' => 'صيغة البريد الإلكتروني غير صحيحة.',
            'email.unique' => 'البريد الإلكتروني مستخدم من قبل.',
            'password.required' => 'كلمة المرور مطلوبة.',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق.',
        ]);

        $phone = $this->normalizePhone($data['phone']);
        $email = $data['email'] ?? null;

        $user = User::create([
            'name' => $data['name'],
            'email' => $email ?: $this->internalEmailForPhone($phone),
            'phone' => $phone,
            'password' => $data['password'],
            'role' => 'customer',
        ]);

        $user->forceFill([
            'marketing_opt_in' => $request->boolean('marketing_opt_in'),
        ])->save();

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

    private function normalizePhone(string $phone): string
    {
        $phone = trim($phone);
        $phone = str_replace([' ', '-', '(', ')'], '', $phone);

        return $phone;
    }

    private function internalEmailForPhone(string $phone): string
    {
        $clean = preg_replace('/[^0-9a-zA-Z]/', '', $phone) ?: uniqid('customer', true);

        return 'phone_' . $clean . '@ohmybaby.local';
    }

    private function isInternalPhoneEmail(?string $email): bool
    {
        return is_string($email) && str_ends_with($email, '@ohmybaby.local');
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
            'email' => $this->isInternalPhoneEmail($user->email) ? null : $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'avatar_url' => $user->avatar_url,
            'google_connected' => filled($user->google_id),
            'marketing_opt_in' => (bool) ($user->marketing_opt_in ?? false),
        ];
    }
}