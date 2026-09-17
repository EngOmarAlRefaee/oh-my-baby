# OH MY BABY — 2026-09-12 implementation notes

This build keeps the existing catalog/size logic and dark-mode animated background, while adding the requested storefront/order-flow changes.

## What changed

- Stable sticky header: removed the scroll-size toggle that caused geometry changes/flicker.
- Home anchor navigation now compensates for the real sticky-header height, so sections open fully with their heading visible.
- Cart additions now show a global under-header confirmation saying the product is in the cart but the order has not been submitted yet, with a checkout CTA. Works in light and dark themes.
- Hero media removed for now; hero remains black and preserves its existing text.
- Best Sellers is now a continuous 10-card marquee and runs in the opposite direction from the top promo ticker.
- Lower newsletter/rewards colours were normalized to the site espresso/oat palette.
- Light mode gets a subtle moving ambient dot layer; the existing dark-mode animated background was preserved.
- All customer-facing product/cart/checkout prices can show USD + NEW SYP. USD remains the catalog base price.
- Server-side exchange-rate adapter/cache added, with SP Today as the configured source and a stale/fallback strategy.
- Google customer sign-in plumbing added.
- Order workflow added: customer -> owner/admin review -> assign delivery driver -> delivery -> delivered.
- Customer account now shows order state, driver assignment and loyalty coupons.
- Reward coupon thresholds added and configurable.
- Owner/admin orders view added.
- Delivery dashboard upgraded to daily assigned orders, details, notes and completion state.
- Commission ledger added. Normal fulfilled order = $0.50, decoration = $2.50, orders containing an offer are excluded from the normal $0.50 commission by default.
- TSA-compatible Sham Cash transfer integration added server-side, including optional PIN/manual transfer and optional auto-transfer.

## Required one-time setup

From the `website` directory:

```bash
composer install
npm install
php artisan migrate
npm run build
```

For development, use `npm run dev` instead of `npm run build`.

## Exchange rate

The storefront calls `/api/exchange-rate`; browsers never scrape the provider directly. The server caches the current rate and remembers a last-known-good rate.

Relevant `.env` keys:

```env
OMB_EXCHANGE_PROVIDER=sp_today
OMB_EXCHANGE_URL=https://sp-today.com/app_api/cur_damascus.json
OMB_EXCHANGE_HTML_FALLBACK_URL=https://sp-today.com/en/currency/us-dollar
OMB_EXCHANGE_SIDE=sell
OMB_EXCHANGE_SOURCE_DIVISOR=100
OMB_EXCHANGE_FALLBACK_RATE=
OMB_EXCHANGE_CACHE_MINUTES=5
OMB_EXCHANGE_STALE_HOURS=24
OMB_SYP_ROUND_TO=0.5
```

The divisor is configurable because the current public market format can expose the old-SYP figure while the storefront should display NEW SYP.

For production reliability, obtain the provider's official API access/key and point the adapter at that endpoint instead of relying indefinitely on a public/legacy endpoint or HTML fallback.

## Google customer login

Set:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
```

Until configured, the Google button stays visibly disabled instead of pretending the account is connected.

## Sham Cash commission transfer

The integration is server-side only. Configure:

```env
OMB_SHAM_ENABLED=true
OMB_SHAM_AUTO_TRANSFER=false
OMB_SHAM_API_BASE_URL=https://tsa-api.com/api/v1
OMB_SHAM_API_KEY=
OMB_SHAM_COMPANY_ACCOUNT=
OMB_SHAM_COMMISSION_RECIPIENT=
```

Keep `OMB_SHAM_AUTO_TRANSFER=false` first. From Owner Operations, test a real commission with the PIN flow if the wallet/provider requests one. After successful controlled testing, auto transfer can be enabled.

No real transfer can occur until the company wallet/API key and the commission recipient wallet are supplied.

## Roles

- `owner`: full access, including commission transfer.
- `admin`: catalog/order operations and driver assignment; can view commission ledger but cannot initiate payout.
- `delivery`: sees assigned delivery work and updates delivery status.
- `member`: customer account, orders and rewards.

The existing non-production demo accounts seeder remains available only outside production.

## Important production hardening before taking real paid orders

The original project stores the product catalog in browser `localStorage`. To avoid breaking the existing UI, that catalog flow was preserved. Consequently, the new checkout currently receives product/price snapshots from the client.

Before enabling real payment/commission settlement in production, move the authoritative product catalog and USD price to the server/database and make `OrderController` recalculate every order item and total from server-side product records. Do not trust browser-submitted prices for real money.

Also add normal operational hardening: HTTPS, production session/cookie config, rate limiting, database backups, audit logs for staff status changes, and provider webhook/idempotency handling if the payment bridge supports it.

## Build note for this handoff

PHP syntax and Laravel route registration were checked. A full migration/build could not be completed in the handoff container because its PHP image does not include the SQLite PDO driver and the copied `node_modules` contains platform-specific packages from the original environment. Run `npm install` and the commands above on the target machine before final acceptance.
