# OH MY BABY — Internal commission ledger and debt balance

## Current scope

This stage builds the internal financial source of truth. Live Sham Cash transfer is intentionally deferred.

### Normal order commission

A normal eligible order creates the $0.50 debt only after both conditions are true:

1. Delivery marked the order delivered.
2. Customer confirmed receipt from the Customer dashboard.

The responsible Admin is the Admin that accepted the order. Legacy orders can fall back to Primary Admin when no acceptance actor exists.

From the Admin account perspective:

- Commission charge: negative ledger entry, e.g. `-0.50 USD`.
- Confirmed settlement/payment: positive entry.
- Valid commission reversal: positive entry.

Therefore an Admin that owes $2.00 has:

- Balance: `-2.00 USD`
- Amount due: `2.00 USD`

## Immutability

Original commission entries are never deleted when a return happens. A separate `commission_reversal` entry is created.

## Settlements

Only Owner can record a confirmed settlement in this phase.

Settlements may be partial. They are allocated FIFO to open commission charges and store:

- amount
- transaction/reference ID (optional for now)
- note
- confirmation time
- number of commission/order entries covered

This is ready to become the confirmation layer for Sham Cash later.

## Decoration

Decoration commission is deliberately marked `deferred` and does not affect the normal Admin ledger yet. The special decoration settlement flow will be built separately as requested.

## Offers

Current configured rule remains: orders containing Offers items are excluded from the normal $0.50 commission.

## Main API

- `GET /api/owner/commissions`
- `POST /api/owner/finance/accounts/{account}/settlements` — Owner only
- `POST /api/orders/{order}/confirm-receipt` — Customer who owns the order

## Test

```powershell
php artisan test --filter=FinancialLedgerDebtTest
```
