# OH MY BABY - Order safety patch (2026-10-08)

## Changes
- OrderController: authoritative server-side price lookup for catalog and legacy products; only active products permitted; transactional stock reservation for each color/size; no reliance on client-submitted totals.
- CatalogInventoryService: reserve and restore legacy-product inventory in addition to catalog inventory.
- OrderItem: allows inventory_key to be persisted (field exists in catalog migration).
- AdminOrderController: rejecting an order restores reserved inventory in one transaction.

## Install on your local project (BACK UP FILES FIRST)
Copy the four `app/...` PHP files in this archive into the same locations under `website`, replacing those four files only. **Do not** copy the ZIP to public/ or extract it into the web-served directory.

## Verify before deployment
1. Back up the database and affected files.
2. Run: `php artisan migrate:status`, `php artisan test`, `php artisan optimize:clear`
3. Create a small test product with stock 1 (choose its matching color/size). Place one order: stock should become 0; placing another should return validation error (422).
4. Reject the first order as admin: inventory should restore to 1; repeated rejection must not restore twice.
5. Tamper with `unit_price_usd` in the browser request; the saved order amount must still match the database price (including valid offer price).
6. Test a legacy product and a catalog product; test several line items in one order, including two lines for the same color/size.

## Limitations / operational notes
- PHP syntax checked locally. Laravel integration tests were NOT run (dependencies and live database absent).
- Existing orders created before this patch do not get a retrospective inventory reservation.
- Products must exist in `catalog_products` or `products` with valid server-side prices and recorded inventory. Stockless products will be rejected.
- The display price from the cart may differ from freshly saved database pricing; implement a price-change confirmation UI before charging customers, if needed.
- Concurrent inventory correctness depends on transactional row locking supported by the deployed database engine. Use a proper production database and test concurrency.
- Review other flows that modify stock or end orders after acceptance for any separate restoration requirements.
