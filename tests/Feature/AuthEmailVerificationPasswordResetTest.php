<?php

namespace Tests\Feature;

use App\Models\AuthCode;
use App\Models\User;
use App\Notifications\EmailVerificationCodeNotification;
use App\Notifications\PasswordResetCodeNotification;
use App\Services\AuthCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthEmailVerificationPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_registration_requires_email_and_sends_verification_code(): void
    {
        Notification::fake();

        $response = $this->postJson('/auth/register', [
            'name' => 'Customer Test',
            'phone' => '0999000011',
            'email' => 'customer@example.com',
            'password' => 'StrongPass123',
            'password_confirmation' => 'StrongPass123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('verification_required', true);

        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $this->assertNull($user->email_verified_at);

        Notification::assertSentTo($user, EmailVerificationCodeNotification::class);
    }

    public function test_customer_can_verify_email_with_six_digit_code(): void
    {
        Notification::fake();

        $this->postJson('/auth/register', [
            'name' => 'Customer Test',
            'phone' => '0999000012',
            'email' => 'verify@example.com',
            'password' => 'StrongPass123',
            'password_confirmation' => 'StrongPass123',
        ])->assertCreated();

        $user = User::where('email', 'verify@example.com')->firstOrFail();

        $code = null;
        Notification::assertSentTo(
            $user,
            EmailVerificationCodeNotification::class,
            function (EmailVerificationCodeNotification $notification) use (&$code) {
                $code = $notification->code;
                return true;
            }
        );

        $this->assertNotNull($code);

        $this->postJson('/auth/email-verification/verify', [
            'code' => $code,
        ])->assertOk()
            ->assertJsonPath('verified', true);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_unverified_customer_is_not_blocked_from_checkout_by_email_verification(): void
    {
        $user = User::factory()->unverified()->create([
            'role' => 'customer',
            'email' => 'unverified@example.com',
        ]);

        $response = $this->actingAs($user)->postJson('/api/orders', []);

        $this->assertNotSame(403, $response->status());
        $this->assertNotSame('email_verification_required', $response->json('code'));
    }

    public function test_verification_code_expires_and_resend_is_rate_limited(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'role' => 'customer',
            'email' => 'expired@example.com',
        ]);

        AuthCode::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'purpose' => AuthCodeService::PURPOSE_VERIFY_EMAIL,
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->subMinute(),
        ]);

        $this->actingAs($user)
            ->postJson('/auth/email-verification/verify', ['code' => '123456'])
            ->assertUnprocessable();

        $this->postJson('/auth/email-verification/send')
            ->assertOk();

        $this->postJson('/auth/email-verification/send')
            ->assertUnprocessable();
    }

    public function test_password_reset_code_changes_password_and_old_password_stops_working(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'role' => 'customer',
            'email' => 'reset@example.com',
            'password' => 'OldPassword123',
        ]);

        $this->postJson('/auth/password/forgot', [
            'email' => $user->email,
        ])->assertOk();

        $code = null;
        Notification::assertSentTo(
            $user,
            PasswordResetCodeNotification::class,
            function (PasswordResetCodeNotification $notification) use (&$code) {
                $code = $notification->code;
                return true;
            }
        );

        $this->assertNotNull($code);

        $this->postJson('/auth/password/reset', [
            'email' => $user->email,
            'code' => $code,
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ])->assertOk();

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123', $user->password));
        $this->assertFalse(Hash::check('OldPassword123', $user->password));
    }

    public function test_forgot_password_does_not_reveal_if_email_exists(): void
    {
        Notification::fake();

        $this->postJson('/auth/password/forgot', [
            'email' => 'does-not-exist@example.com',
        ])->assertOk()
            ->assertJson([
                'message' => 'إذا كان البريد مسجلاً لدينا، سيصلك رمز إعادة تعيين كلمة المرور.',
            ]);

        Notification::assertNothingSent();
    }
}
