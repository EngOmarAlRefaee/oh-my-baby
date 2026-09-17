@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo OH MY BABY - APPLY PERMISSIONS PATCH
echo ================================================
php artisan migrate --force
if errorlevel 1 goto :error
php artisan optimize:clear
if errorlevel 1 goto :error
php artisan migrate:status
echo.
echo Permissions patch applied successfully.
echo Refresh the browser with Ctrl+Shift+R.
pause
exit /b 0
:error
echo.
echo ERROR: The permissions patch could not be applied.
echo Do NOT run migrate:fresh or delete database.sqlite.
pause
exit /b 1
