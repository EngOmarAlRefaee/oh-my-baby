<?php

namespace App\Services;

use App\Models\AuthCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthCodeService
{
    public const PURPOSE_VERIFY_EMAIL = 'verify_email';
    public const PURPOSE_PASSWORD_RESET = 'password_reset';
    public const TTL_MINUTES = 10;
    public const RESEND_COOLDOWN_SECONDS = 60;
    public const MAX_ATTEMPTS = 5;

    /**
     * @return array{code:string, expires_at:string, retry_after:int}
     */
    public function issue(User $user, string $purpose): array
    {
        $email = mb_strtolower(trim((string) $user->email));

        if ($email === '' || str_ends_with($email, '@ohmybaby.local')) {
            throw ValidationException::withMessages([
                'email' => ['هذا الحساب لا يملك بريداً إلكترونياً صالحاً لإرسال الرمز.'],
            ]);
        }

        $latest = AuthCode::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        // Cooldown applies only while the latest code is still active.
        // If the code is already expired, the user must be able to request
        // a replacement immediately instead of being locked out.
        if ($latest?->created_at && $latest->expires_at?->isFuture()) {
            $elapsed = (int) floor($latest->created_at->diffInSeconds(now()));
            if ($elapsed < self::RESEND_COOLDOWN_SECONDS) {
                $remaining = max(1, self::RESEND_COOLDOWN_SECONDS - $elapsed);
                throw ValidationException::withMessages([
                    'email' => ["انتظر {$remaining} ثانية قبل طلب رمز جديد."],
                ]);
            }
        }

        return DB::transaction(function () use ($user, $email, $purpose) {
            AuthCode::query()
                ->where('email', $email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            $code = (string) random_int(100000, 999999);
            $expiresAt = now()->addMinutes(self::TTL_MINUTES);

            AuthCode::create([
                'user_id' => $user->id,
                'email' => $email,
                'purpose' => $purpose,
                'code_hash' => Hash::make($code),
                'expires_at' => $expiresAt,
                'attempts' => 0,
            ]);

            AuthCode::query()
                ->where('expires_at', '<', now()->subDay())
                ->delete();

            return [
                'code' => $code,
                'expires_at' => $expiresAt->toIso8601String(),
                'retry_after' => self::RESEND_COOLDOWN_SECONDS,
            ];
        });
    }

    public function verify(User $user, string $purpose, string $code): void
    {
        $email = mb_strtolower(trim((string) $user->email));

        DB::transaction(function () use ($user, $email, $purpose, $code) {
            $record = AuthCode::query()
                ->where('user_id', $user->id)
                ->where('email', $email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $record || $record->expires_at->isPast()) {
                if ($record && is_null($record->consumed_at)) {
                    $record->forceFill(['consumed_at' => now()])->save();
                }

                throw ValidationException::withMessages([
                    'code' => ['انتهت صلاحية الرمز. اطلب رمزاً جديداً.'],
                ]);
            }

            if ($record->attempts >= self::MAX_ATTEMPTS) {
                $record->forceFill(['consumed_at' => now()])->save();

                throw ValidationException::withMessages([
                    'code' => ['تم تجاوز عدد المحاولات المسموح. اطلب رمزاً جديداً.'],
                ]);
            }

            $record->increment('attempts');
            $record->refresh();

            if (! Hash::check($code, $record->code_hash)) {
                if ($record->attempts >= self::MAX_ATTEMPTS) {
                    $record->forceFill(['consumed_at' => now()])->save();
                }

                throw ValidationException::withMessages([
                    'code' => ['رمز التحقق غير صحيح.'],
                ]);
            }

            $record->forceFill(['consumed_at' => now()])->save();
        });
    }
}
