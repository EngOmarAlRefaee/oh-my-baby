@echo off
setlocal
cd /d "%~dp0"
title OH MY BABY - Apply product variants patch

echo ==========================================================
echo OH MY BABY - PRODUCT VARIANTS / INVENTORY UPDATE
echo ==========================================================
echo.
echo [1/3] Applying database migrations...
php artisan migrate --force
if errorlevel 1 goto :err

echo [2/3] Clearing Laravel caches...
php artisan optimize:clear
if errorlevel 1 goto :err

echo [3/3] Migration status...
php artisan migrate:status

echo.
echo DONE.
echo If Vite/Laravel are already running, refresh with Ctrl+Shift+R.
echo Otherwise run START_TEST_WINDOWS.bat.
pause
exit /b 0

:err
echo.
echo ERROR. Read the Laravel message above.
pause
exit /b 1
