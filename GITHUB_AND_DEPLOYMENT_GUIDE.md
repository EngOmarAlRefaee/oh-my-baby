# OH MY BABY — GitHub & Production Guide

This project was cleaned so it can be pushed to GitHub without local secrets or runtime files.

## Before pushing to GitHub

Run these commands from the `website` directory:

```bash
git init
git status
git add .
git commit -m "Prepare OH MY BABY for GitHub and production"
```

Before `git add`, confirm these files/folders are NOT tracked:

```bash
git status --ignored
```

Do not commit:

- `.env`
- `.env.*` except `.env.example`, `.env.local.example`, `.env.production.example`
- `vendor/`
- `node_modules/`
- `database/*.sqlite`
- `public/hot`
- `public/storage`
- `public/uploads`
- log/cache/session files

## Local setup

```bash
composer install
npm ci
cp .env.local.example .env
php artisan key:generate
php artisan migrate
npm run dev
php artisan serve
```

## Production setup

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

Then edit `.env` on the server and set the real values for:

- `APP_URL`
- database credentials
- mail SMTP credentials
- Google OAuth keys if Google login is used
- any payment/delivery provider keys if added later

## Production safety checklist

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY` generated on the server
- HTTPS enabled on the domain
- database password is strong and not reused
- mail credentials are real production credentials
- `public/hot` does not exist
- `storage:link` was created
- queue worker is configured if queues are used
- cron runs Laravel scheduler if scheduled tasks are added

## Notes

UI sizes, layout, colors, and page design were not changed in this cleanup. The changes are limited to GitHub safety, deployment templates, ignored files, and documentation.
