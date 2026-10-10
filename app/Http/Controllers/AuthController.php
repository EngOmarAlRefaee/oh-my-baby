<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\EmailVerificationCodeNotification;
use App\Notifications\PasswordResetCodeNotification;
use App\Services\AuthCodeService;
use App\Support\DataScope;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
            'identifier' => ['nullable', 'string', 'max:180', 'required_without:phone'],
            'phone' => ['nullable', 'string', 'max:40', 'required_without:identifier'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $identifier = trim((string) ($data['identifier'] ?? $data['phone'] ?? ''));

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $user = User::whereRaw('LOWER(email) = ?', [mb_strtolower($identifier)])->first();
        } else {
            $user = User::where('phone', $this->normalizePhone($identifier))->first();
        }

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'رقم الهاتف أو البريد الإلكتروني أو كلمة المرور غير صحيحة.',
            ], 422);
        }

        if (($user->account_status ?? 'active') !== 'active') {
            return response()->json([
                'message' => 'هذا الحساب موقوف. تواصل مع إدارة المتجر.',
                'code' => 'account_suspended',
            ], 403);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => 'Signed in.',
            'user' => $this->safeUser($user),
            'redirect' => $this->dashboardForRole($user->role),
            'verification_required' => $this->requiresEmailVerification($user),
        ]);
    }

    public function register(Request $request, AuthCodeService $codes): JsonResponse
    {
        if ($request->filled('phone')) {
            $request->merge(['phone' => $this->normalizePhone((string) $request->input('phone'))]);
        }
        if ($request->filled('email')) {
            $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => [
                'required',
                'string',
                'max:40',
                Rule::unique('users', 'phone'),
            ],
            'email' => [
                'required',
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
            'email.required' => 'البريد الإلكتروني مطلوب لتأكيد الحساب.',
            'email.email' => 'صيغة البريد الإلكتروني غير صحيحة.',
            'email.unique' => 'البريد الإلكتروني مستخدم من قبل.',
            'password.required' => 'كلمة المرور مطلوبة.',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق.',
        ]);

        $user = DB::transaction(function () use ($data, $request) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $this->normalizePhone($data['phone']),
                'password' => $data['password'],
                'role' => 'customer',
                'storefront_access' => true,
            ]);

            $user->forceFill([
                'marketing_opt_in' => $request->boolean('marketing_opt_in'),
                'email_verified_at' => null,
            ])->save();

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();

        $deliveryFailed = ! $this->sendVerificationCode($user, $codes);

        return response()->json([
            'message' => $deliveryFailed
                ? 'تم إنشاء الحساب، لكن تعذر إرسال رمز التحقق الآن. يمكنك إعادة الإرسال من شاشة التحقق.'
                : 'تم إنشاء الحساب وإرسال رمز التحقق إلى بريدك.',
            'user' => $this->safeUser($user->fresh()),
            'redirect' => $this->dashboardForRole($user->role),
            'verification_required' => true,
            'verification_delivery_failed' => $deliveryFailed,
            'retry_after' => AuthCodeService::RESEND_COOLDOWN_SECONDS,
        ], 201);
    }

    public function sendEmailVerification(Request $request, AuthCodeService $codes): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'البريد الإلكتروني موثق بالفعل.',
                'verified' => true,
            ]);
        }

        $issued = $codes->issue($user, AuthCodeService::PURPOSE_VERIFY_EMAIL);
        $user->notify(new EmailVerificationCodeNotification($issued['code']));

        return response()->json([
            'message' => 'تم إرسال رمز التحقق إلى بريدك.',
            'verified' => false,
            'retry_after' => $issued['retry_after'],
            'expires_at' => $issued['expires_at'],
        ]);
    }

    public function verifyEmail(Request $request, AuthCodeService $codes): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'digits:6'],
        ], [
            'code.required' => 'أدخل رمز التحقق.',
            'code.digits' => 'رمز التحقق مكوّن من 6 أرقام.',
        ]);

        $user = $request->user();
        abort_unless($user, 401);

        if (! $user->email_verified_at) {
            $codes->verify($user, AuthCodeService::PURPOSE_VERIFY_EMAIL, $data['code']);
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return response()->json([
            'message' => 'تم توثيق البريد الإلكتروني بنجاح.',
            'user' => $this->safeUser($user->fresh()),
            'verified' => true,
            'redirect' => $this->dashboardForRole($user->role),
        ]);
    }

    public function forgotPassword(Request $request, AuthCodeService $codes): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:180'],
        ], [
            'email.required' => 'أدخل البريد الإلكتروني.',
            'email.email' => 'صيغة البريد الإلكتروني غير صحيحة.',
        ]);

        $email = mb_strtolower(trim($data['email']));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($user && ! $this->isInternalPhoneEmail($user->email)) {
            try {
                $issued = $codes->issue($user, AuthCodeService::PURPOSE_PASSWORD_RESET);
                $user->notify(new PasswordResetCodeNotification($issued['code']));
            } catch (\Throwable $error) {
                // Keep the response generic so the endpoint never exposes whether an email exists.
                report($error);
            }
        }

        return response()->json([
            'message' => 'إذا كان البريد مسجلاً لدينا، سيصلك رمز إعادة تعيين كلمة المرور.',
            'retry_after' => AuthCodeService::RESEND_COOLDOWN_SECONDS,
        ]);
    }

    public function resetPassword(Request $request, AuthCodeService $codes): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:180'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'email.required' => 'أدخل البريد الإلكتروني.',
            'email.email' => 'صيغة البريد الإلكتروني غير صحيحة.',
            'code.required' => 'أدخل رمز الاسترجاع.',
            'code.digits' => 'رمز الاسترجاع مكوّن من 6 أرقام.',
            'password.required' => 'كلمة المرور الجديدة مطلوبة.',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق.',
        ]);

        $email = mb_strtolower(trim($data['email']));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user || $this->isInternalPhoneEmail($user->email)) {
            return response()->json([
                'message' => 'رمز الاسترجاع غير صحيح أو منتهي الصلاحية.',
            ], 422);
        }

        $codes->verify($user, AuthCodeService::PURPOSE_PASSWORD_RESET, $data['code']);

        DB::transaction(function () use ($user, $data) {
            $user->forceFill([
                'password' => $data['password'],
                'remember_token' => Str::random(60),
            ])->save();

            DB::table('sessions')->where('user_id', $user->id)->delete();
        });

        return response()->json([
            'message' => 'تم تغيير كلمة المرور. يمكنك تسجيل الدخول بكلمة المرور الجديدة.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    private function sendVerificationCode(User $user, AuthCodeService $codes): bool
    {
        try {
            $issued = $codes->issue($user, AuthCodeService::PURPOSE_VERIFY_EMAIL);
            $user->notify(new EmailVerificationCodeNotification($issued['code']));

            return true;
        } catch (\Throwable $error) {
            Log::warning('Unable to send email verification code.', [
                'user_id' => $user->id,
                'error' => $error->getMessage(),
            ]);

            return false;
        }
    }

    private function requiresEmailVerification(User $user): bool
    {
        return $user->role === 'customer'
            && ! $this->isInternalPhoneEmail($user->email)
            && ! $user->email_verified_at;
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
            'customer' => '/customer',
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
            'is_primary_admin' => (bool) ($user->is_primary_admin ?? false),
            'account_status' => $user->account_status ?? 'active',
            'storefront_access' => (bool) ($user->storefront_access ?? in_array($user->role, ['owner', 'customer'], true)),
            'effective_permissions' => PermissionCatalog::effectiveFor($user),
            'effective_data_scopes' => DataScope::effectiveFor($user),
            'avatar_url' => $user->avatar_url,
            'google_connected' => filled($user->google_id),
            'marketing_opt_in' => (bool) ($user->marketing_opt_in ?? false),
            'email_verified' => (bool) $user->email_verified_at,
            'email_verification_required' => $this->requiresEmailVerification($user),
        ];
    }
}
