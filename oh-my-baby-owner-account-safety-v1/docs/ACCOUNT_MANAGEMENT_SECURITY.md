# OH MY BABY — Account Management Safety Rules

This document describes the rules used by the Owner account-management screen.

## Core rule
Operational account management must happen from `/owner/team`, not from Tinker during normal use.
Tinker remains an emergency/development tool only.

## Owner capabilities
- Create Admin / Delivery / Customer accounts.
- Edit name, email, phone and delegated permissions.
- Change a password when necessary.
- Suspend / reactivate accounts.
- Assign the Primary Admin.
- Permanently delete **only an unused account with no linked business history**.

## Permanent deletion protection
Permanent deletion is intentionally blocked when an account is linked to business data such as:
- customer orders
- assigned deliveries or return deliveries
- order event history
- reward coupons
- owner requests
- catalog-product attribution
- wishlist / product reviews
- poll votes / customer feedback

If an account has business history, suspend it instead. This prevents accidental deletion of order, delivery, audit or financial context.

The Owner account cannot be deleted from the team screen.
The Primary Admin must first be reassigned before it can be suspended or permanently deleted.

## Atomic writes
Create, update, suspend, reactivate, Primary Admin reassignment and permanent deletion are wrapped in database transactions. A failed operation is rolled back instead of leaving half-applied state.

## Identity rules
- Emails are normalized to lowercase.
- Phones are normalized by removing spaces, dashes and parentheses.
- Email and phone duplication is rejected server-side.
- A database migration normalizes existing phones and adds a unique phone index. If historical duplicates exist, the migration stops with an explicit error instead of guessing which account should win.

## Sessions
Suspending an account, changing its password, or permanently deleting it invalidates database sessions for that user when the `sessions` table is in use.
A suspended account is also rejected directly by the login endpoint.

## Audit trail
Sensitive account-management actions continue to be written to `staff_action_logs`.
New log entries include a target-account snapshot so history remains understandable even if an unused account is later permanently deleted.

## Demo accounts
`DatabaseSeeder` no longer creates demo accounts.
`DemoAccountsSeeder` is permanently retired and throws if called manually.

## Test command
After applying the patch and running migrations:

```powershell
php artisan test --filter=TeamManagementSecurityTest
```

Then manually test `/owner/team` with the real Owner account before creating production staff accounts.
