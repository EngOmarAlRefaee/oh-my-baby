# OH MY BABY — Applied Fix Report

## Applied in this package

- Removed the real `.env` file from the distributable package.
- Replaced `.env.example` with a production-safe template:
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - branded `APP_NAME="OH MY BABY"`
  - encrypted sessions enabled
  - MySQL production defaults instead of bundled SQLite
- Added `.env.local.example` for local development.
- Removed `public/hot` so Laravel will not try to load Vite from `localhost:5173` in production.
- Fixed executable permission on `node_modules/.bin/vite` in this copy.
- Removed bundled `database/database.sqlite` to avoid shipping real/demo runtime data.
- Registered middleware aliases:
  - `permission`
  - `active`
- Added missing API routes for:
  - product catalog public listing
  - product details
  - admin product/catalog management
  - legacy product sync endpoints
  - wishlist
  - product reviews
  - team management
  - owner/admin requests
  - site visit tracking
- Added finer permission middleware to sensitive admin, order, team, product, finance, and delivery routes.
- Tightened public POST rate limits for newsletter and poll endpoints.

## Deployment checklist

1. Copy `.env.example` to `.env` on the server.
2. Fill real DB/mail/domain/Google/Sham Cash values.
3. Run `php artisan key:generate`.
4. Run `composer install --no-dev --optimize-autoloader`.
5. Run `npm ci && npm run build`.
6. Run `php artisan migrate --force`.
7. Run `php artisan storage:link`.
8. Run:
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:cache`

## Notes

This package fixes configuration and routing issues found in the submitted code. It does not replace full QA, payment-provider certification, penetration testing, or production server hardening.

## Verification performed here

- `php artisan route:list --except-vendor` now succeeds and shows 69 routes.
- PHP syntax lint was run over app/routes/bootstrap files successfully before final packaging.
- `npm run build` could not be completed from the originally bundled `node_modules` because a platform-specific Rolldown/Vite optional native package was missing. To avoid shipping broken dependencies, `node_modules` was removed from the fixed package. The existing `public/build/manifest.json` remains included. Rebuild on the target machine with `npm ci && npm run build`.

## Second cleanup pass — GitHub readiness

Additional changes applied:

- Rebuilt `.gitignore` to protect secrets, local databases, uploads, logs, caches, `vendor/`, `node_modules/`, and Vite dev files.
- Added `.env.production.example` for safe server configuration.
- Added `GITHUB_AND_DEPLOYMENT_GUIDE.md` with GitHub and production steps.
- Replaced `README.md` with a clean project overview and setup instructions.
- Added GitHub Actions workflow at `.github/workflows/laravel-check.yml` to check routes and frontend build on push/PR.
- Removed dependency folders from the distributable copy so they are installed fresh with `composer install` and `npm ci`.
- Did not change UI sizes, layout, colors, or visual design.
