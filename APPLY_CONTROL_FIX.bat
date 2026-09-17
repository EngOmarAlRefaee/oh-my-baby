@echo off
setlocal
cd /d "%~dp0"
title OH MY BABY - Apply control center fix

echo ==========================================================
echo OH MY BABY - APPLY CONTROL CENTER FIX
echo ==========================================================
echo.
echo [1/3] Applying pending database migrations...
php artisan migrate --force
if errorlevel 1 goto :err

echo [2/3] Clearing Laravel caches...
php artisan optimize:clear
if errorlevel 1 goto :err

echo [3/3] Migration status...
php artisan migrate:status

echo.
echo DONE. Refresh the browser with Ctrl+Shift+R.
pause
exit /b 0

:err
echo.
echo ERROR. Read the Laravel message above.
pause
exit /b 1
