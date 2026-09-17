@echo off
setlocal
cd /d "%~dp0"
title OH MY BABY - Test launcher

echo ==========================================================
echo OH MY BABY - PRACTICAL TEST MODE - V6 + CONTROL CENTERS + SERVER CATALOG/VARIANT STOCK
echo ==========================================================
echo.

echo [1/5] Removing any stale Vite hot-server pointer...
if exist public\hot del /f /q public\hot

echo [2/5] Clearing Laravel caches...
php artisan optimize:clear
if errorlevel 1 goto :php_error

echo [3/5] Applying database migrations and creating demo accounts...
php artisan migrate --force
if errorlevel 1 goto :php_error
php artisan db:seed --class=DemoAccountsSeeder --force
if errorlevel 1 goto :php_error

echo [4/5] Starting the MODIFIED frontend directly from source via Vite...
start "OH MY BABY - VITE" cmd /k "cd /d ""%CD%"" && npm.cmd run dev -- --host 127.0.0.1"

echo Waiting for Vite to create public\hot...
for /L %%i in (1,1,25) do (
    if exist public\hot goto :vite_ready
    timeout /t 1 /nobreak >nul
)
echo WARNING: Vite did not report ready yet. Laravel will still start.

:vite_ready
echo [5/5] Starting Laravel on http://127.0.0.1:8000 ...
start "OH MY BABY - LARAVEL" cmd /k "cd /d ""%CD%"" && php artisan serve --host=127.0.0.1 --port=8000"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8000"

echo.
echo ==========================================================
echo DEMO LOGINS
ECHO Owner    : owner@ohmybaby.local    / OMB-Owner-2026!
ECHO Admin 1  : admin@ohmybaby.local    / OMB-Admin-2026!
ECHO Admin 2  : admin2@ohmybaby.local   / OMB-Admin2-2026!
ECHO Delivery : delivery@ohmybaby.local / OMB-Delivery-2026!
ECHO Customer : member@ohmybaby.local   / OMB-Member-2026!
echo ==========================================================
echo.
echo IMPORTANT: keep BOTH opened command windows running while testing.
echo The Vite window is what makes the new visual changes appear immediately.
echo Role redirect: Owner -> /owner | Admin -> /admin | Delivery -> /delivery | Customer -> /account
echo Order flow: review -> accept -> dispatch -> delivery -> delivered -> optional return workflow.
echo Catalog: server-backed products + color/size stock + automatic stock reserve/restore.
echo Admin/Owner can use /delivery as fallback if the assigned driver is unavailable.
echo Owner dashboard: /owner ^| Admin dashboard: /admin
echo Owner team page: /owner/team ^| Admin team page: /admin/team
echo Admin -> Owner requests: /admin/owner-requests ^| Owner review: /owner/requests
echo.
pause
exit /b 0

:php_error
echo.
echo ERROR: Laravel setup failed. Read the message above.
echo Make sure PHP and the required database driver are installed.
pause
exit /b 1
