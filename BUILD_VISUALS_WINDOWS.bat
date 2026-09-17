@echo off
setlocal
cd /d "%~dp0"
title OH MY BABY - Build visuals

echo ==========================================================
echo OH MY BABY - BUILD THE MODIFIED VISUALS
ECHO This creates a fresh public\build from resources\js and resources\css.
echo ==========================================================
echo.

if exist public\hot del /f /q public\hot

echo [1/4] Clearing Laravel caches...
php artisan optimize:clear
if errorlevel 1 goto :fail

echo [2/4] Building frontend...
call npm.cmd run build
if errorlevel 1 goto :npm_fail

echo [3/4] Applying migrations...
php artisan migrate --force
if errorlevel 1 goto :fail

echo [4/4] Creating/updating demo accounts...
php artisan db:seed --class=DemoAccountsSeeder --force
if errorlevel 1 goto :fail

echo.
echo DONE. The compiled build now contains the modified visuals.
echo Start the site with:
echo     php artisan serve
ECHO then open http://127.0.0.1:8000
pause
exit /b 0

:npm_fail
echo.
echo NPM BUILD FAILED.
echo Try these commands once, then run this file again:
echo     rmdir /s /q node_modules
ECHO     npm.cmd install
pause
exit /b 1

:fail
echo.
echo Setup failed. Read the error above.
pause
exit /b 1
