# OH MY BABY — Delivery Notes

This package is an updated copy of the existing project. It was not rebuilt from scratch, and the original `.env` and SQLite database were preserved.

## Implemented in this delivery

- Two independent admin catalog worlds: Clothing & Fashion, and Baby World.
- Fashion taxonomy with Newborn, Girls, Boys, Shoes, and Details / Accessories.
- Girls/Boys subcategories, with jeans treated under Pants rather than a separate category.
- Shoes split into Girls / Boys.
- Baby World kept intentionally simple: Newborn Welcome & Decor, Strollers & Seats, Gifts, Toys & Essentials.
- Dynamic Admin add/edit wizard.
- Manual product images only; AI image workspace and placeholders removed.
- Required real image per selected color, with optional extra images per color.
- Size presets from newborn through 16Y, shoe sizes, and custom sizes.
- Inventory per color × size when applicable; stock per color/product for items without sizes.
- Product-page stock limits, disabled unavailable variants, and Arabic/English out-of-stock messaging.
- Cart stock enforcement and live header cart count.
- Persistent wishlist in local storage.
- Product Edit and Delete with confirmation.
- Additional placements kept as the final merchandising step: New Arrivals, Offers, Back to School, Best Sellers.
- Optional offer price below regular price.
- Newborn promotional/editorial section remains separate from the real Newborn catalog category.
- Homepage ordering updated, with Baby World promoted and Best Sellers moved lower.
- Removed the two accidental product strips while preserving their main editorial sections.
- Header ordering and anchor behavior updated.
- Full-width four-column product grids on desktop, responsive below desktop.
- Expanded demo catalog to 50 products across all primary categories.
- Search expanded to names, categories, subcategories, colors, and sizes, including Arabic age phrasing such as "6 سنوات".
- Dark mode deepened and given a lightweight CSS-only drifting micro-star background.
- Scroll motion consolidated around a single IntersectionObserver-based system.
- Laravel authentication foundation added for Owner, Admin, Delivery, and Customer/Member. Guest remains unauthenticated.
- Admin and Delivery routes are protected by backend role middleware.

## Windows setup after replacing your working copy

From the project folder:

```bash
npm install
npm run build
php artisan migrate
php artisan serve
```

Do **not** run `migrate:fresh`.

## Optional local demo accounts

The project includes `DemoAccountsSeeder`, which is blocked in production. For local testing only:

```bash
php artisan db:seed --class=DemoAccountsSeeder
```

Default local demo credentials can be overridden using the `OMB_DEMO_*` environment variables. Review `database/seeders/DemoAccountsSeeder.php` before using them.

## Verification performed before packaging

- PHP syntax checks passed for the modified backend files.
- Laravel route registration passed and role-protected routes were visible.
- All JS/JSX files passed TypeScript parser/transpilation syntax checks.
- Static image/video references were checked and no referenced local asset was missing.
- Demo catalog integrity checks passed for categories, subcategories, color images, and variant inventory.
- Cart/variant stock logic was tested independently for maximum-stock enforcement.

The production Vite build could not be executed in the packaging environment because the uploaded `node_modules` contains Windows-native Rolldown bindings while the packaging environment is Linux. The original Windows `node_modules` was left intact rather than replacing it with Linux binaries. Run `npm install && npm run build` on the Windows machine as shown above.
