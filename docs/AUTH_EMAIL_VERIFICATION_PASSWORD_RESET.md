# OH MY BABY — Email verification and password reset

## Email verification

Public customer registration now requires a real email address.

Flow:

1. Customer creates an account with name, phone, email and password.
2. The account is created with `email_verified_at = null`.
3. A six-digit verification code is sent to the email.
4. Code lifetime: 10 minutes.
5. Resend cooldown: 60 seconds.
6. Maximum verification attempts per code: 5.
7. A new code invalidates the previous active code.
8. After a correct code, `email_verified_at` is set.
9. Customers with a real but unverified email cannot submit an order.

Google accounts whose Google email is already verified are marked verified automatically.

Legacy phone-only customer accounts using an internal `@ohmybaby.local` address remain compatible. New public registrations cannot use this fallback because email is required.

## Password reset

1. User enters the account email.
2. The endpoint always returns a generic response so it does not reveal whether the email exists.
3. If the email exists, a six-digit reset code is sent.
4. Code lifetime: 10 minutes.
5. Resend cooldown: 60 seconds.
6. Maximum code attempts: 5.
7. On success, the password is replaced and existing database sessions are invalidated.

## Security

Codes are never stored in plaintext. `auth_codes.code_hash` stores a one-way password hash.

The backend enforces expiration, attempt limits, cooldown and purpose separation (`verify_email` vs `password_reset`).

## Mail delivery

Laravel mail configuration is read from `.env`.

For local development, `MAIL_MAILER=log` writes mail content to the Laravel log instead of sending real email.

For production, configure a real SMTP/API mail provider in `.env`. Never commit mail credentials to Git.

## Main endpoints

- `POST /auth/email-verification/send`
- `POST /auth/email-verification/verify`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`

## Test

Run:

```powershell
php artisan test --filter=AuthEmailVerificationPasswordResetTest
```
