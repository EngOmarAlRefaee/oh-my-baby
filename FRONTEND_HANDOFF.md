# OH MY BABY — Updated Project Handoff

This is an update of the existing OH MY BABY project. It is not a rebuilt project.

## Implemented in this iteration
- Existing Arabic / English RTL-LTR behavior and the working announcement marquee are preserved.
- Header order is aligned with the approved storefront flow: About, New Arrivals, Clothing, Offers, Baby World, Back to School, Newborn, Best Sellers, Sign in.
- Clothing and Baby World use one shared catalog definition so Header, Admin, category pages, filters and search do not maintain conflicting copies of the taxonomy.
- Fashion taxonomy includes Newborn, Girls, Boys, Shoes and Details / Accessories, with fashion subcategories and jeans kept under Pants.
- Baby World contains Newborn Welcome & Decor, Strollers & Seats, Gifts and Toys & Essentials.
- Category pages include contextual sub-navigation and responsive full-width product grids.
- Demo catalog is populated across all visible categories/subcategories and discovery collections for presentation/testing.
- Product detail supports color, size, quantity, real variant stock limits and bilingual Out of Stock states.
- Cart and wishlist are persisted locally for the current frontend phase; the cart prevents quantities above available variant stock.
- Admin product creation is a dynamic wizard with separate world/category logic, per-color image requirements, size presets through 16Y, custom sizes, color × size inventory, optional offer pricing, descriptions, and additional placements at the end.
- Admin product edit and delete flows include targeted editing and delete confirmation.
- Product images are manual uploads only. There is no AI image-generation, recoloring, virtual dressing, AI image API, or AI-image placeholder in the product workflow.
- Back-to-School and Newborn editorial sections are preserved while the two accidental product strips inside them were removed.
- Baby World was moved higher in the homepage flow and Best Sellers moved lower, as approved.
- Dark mode uses a deep-black base and a lightweight CSS-only micro-star drift layer with reduced-motion support.
- Scroll entrances use one shared IntersectionObserver-based ScrollMotion architecture; no JavaScript scroll loop/requestAnimationFrame system is added.
- Authentication foundation includes Owner, Admin, Delivery and Customer/Member roles. Public registration can create Customer accounts only; protected Admin and Delivery routes are enforced by Laravel middleware.

## Current architecture boundary
The storefront catalog/cart/admin product data is still frontend-stage data (demo/localStorage), intentionally keeping the current focus on frontend + UX. The data model is structured so it can later be replaced by Laravel `/api/v1/...` endpoints without rebuilding the storefront UI.

Large uploaded product images stored through the current Admin prototype can hit browser localStorage limits. Production image storage should move to Laravel/server object storage when the backend product module is implemented.

## Safe Windows run steps
Do not run `migrate:fresh` and do not delete the existing database or `.env`.

From the project folder:

```powershell
php artisan migrate
npm.cmd run dev
php artisan serve
```

Then open `http://127.0.0.1:8000`.

To create the optional local demo role accounts once:

```powershell
php artisan db:seed --class=DemoAccountsSeeder
```

Demo accounts are defined in `database/seeders/DemoAccountsSeeder.php`. Change/remove demo credentials before any production deployment.

## Validation performed before handoff
- JSX/JS syntax parse check across `resources/js`.
- PHP syntax validation for application/migration/seeder/routes files.
- Laravel route registration check.
- Catalog consistency check for categories, subcategories, placements, inventory and offer prices.
- Cart stock-cap and legacy-localStorage migration behavior check.
- Public image/video reference existence scan.

A Linux Vite production build could not be executed in the handoff environment because the uploaded `node_modules` contains the Windows Rolldown native binding. The Windows dependencies were intentionally left untouched rather than replacing them with Linux binaries. Run `npm.cmd run dev` or `npm.cmd run build` on the original Windows environment for the native Vite check.
