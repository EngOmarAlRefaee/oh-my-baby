# OH MY BABY — implementation update (2026-09-21)

This update keeps the existing product-entry flow (categories, per-category sizes, colors, required image per color, stock per color × size) and adds the agreed production-oriented features on top of it.

## Added / changed

- Products can be marked **Summer** and/or **Winter** from Admin.
- Customer category pages show **All / Summer / Winter** above the existing subcategory/filter header.
- Product listing sorting is now **Newest / Best selling / Price low-high / Price high-low**.
- Out-of-stock products are sorted to the end. Server scheduler archives products after 30 days out of stock.
- Catalog loads 24 items at a time with **Load more**.
- Product cards no longer have Quick Add. Ordering happens from the product page.
- Product page shows only **Available / Out of stock**, includes wishlist, optional size guide, similar products, and verified reviews.
- Best Sellers uses real delivered-order sales by default, allows Admin pinning through the Best Sellers placement, never duplicates items, and loops continuously.
- Best Seller cards lead to the product's main category, not direct checkout.
- Baby World cards are **Coming soon**, non-clickable, with per-section interest polls.
- Newsletter subscriptions are persisted in the database.
- Public promo codes are persisted in the database. `BABY10` (10%, first order only) is seeded as active and can be edited from Admin/Owner Marketing.
- Header promo/nudge reads the active code dynamically and uses RTL-safe logical positioning.
- Admin/Owner Marketing page: promo settings, newsletter subscribers, poll results.
- Product images uploaded from Admin are stored on Laravel's public disk instead of browser Base64 for new uploads.
- Wishlist remains available to guests locally and merges/syncs to the signed-in account.
- Order pricing is authoritative on the server: product price, offer price, product names, image, category and stock are read from the live product database, not trusted from browser payload.
- Stock is deducted when Admin accepts an order and restored when a return is completed.
- Order items remain snapshots so historical orders keep the exact requested color/size/price even if the product changes later.
- Product reviews can only be submitted by a customer who has a delivered order containing that product.
- Commission transfer endpoint is Owner-only; Admin can still view permitted financial information.
- Dark-mode moving background is applied through the global app shell; brightness and movement speed were increased.

## Required after pulling this update

```bash
composer install
npm install
php artisan migrate
php artisan storage:link
npm run build
```

For local development also ensure the PHP SQLite/PDO extension is enabled when using SQLite.

Open `/admin/products` once after migration while using the browser that currently contains the working local catalog. The page bulk-syncs that current catalog into the new server-side products table without changing the existing Admin entry workflow.

## Scheduler

The 30-day out-of-stock archive uses Laravel Scheduler. Production must run Laravel's scheduler (for example a cron entry that runs `php artisan schedule:run` every minute).

Manual command:

```bash
php artisan catalog:archive-stale
```

## Deployment note

Do not deploy `.env`, `node_modules`, `vendor`, `database/database.sqlite`, or `public/hot` from a development machine. Configure production `.env` on the server and use a production database.
