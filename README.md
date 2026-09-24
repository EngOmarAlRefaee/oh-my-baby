# OH MY BABY

Laravel + React/Vite e-commerce project for a baby and kids store.

## Main sections

- Home page with hero/video, offers, new arrivals, baby world, back-to-school, best sellers, rewards, account, and newsletter sections.
- Product catalog, category pages, product detail pages, search, cart, checkout, wishlist, and account pages.
- Admin, owner, and delivery dashboards.
- Orders, returns, marketing, promo, commissions, team permissions, newsletter, and interest polls.

## Safe GitHub version

This repository is prepared to avoid committing secrets and local runtime files. Use `.env.example`, `.env.local.example`, or `.env.production.example` as templates only. Never commit a real `.env` file.

See `GITHUB_AND_DEPLOYMENT_GUIDE.md` for the full setup and deployment checklist.

## Local development

```bash
composer install
npm ci
cp .env.local.example .env
php artisan key:generate
php artisan migrate
npm run dev
php artisan serve
```

## Production build

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
cp .env.production.example .env
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

After copying `.env.production.example`, edit `.env` on the server with the real domain, database, mail, and OAuth credentials.
