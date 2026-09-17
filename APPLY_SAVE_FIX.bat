@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo OH MY BABY - PERMISSIONS SAVE UX FIX
echo ================================================
php artisan optimize:clear
if errorlevel 1 goto :error
echo.
echo Fix applied. If Vite is running, refresh with Ctrl+Shift+R.
echo If Vite is not running, start START_TEST_WINDOWS.bat.
pause
exit /b 0
:error
echo.
echo ERROR while clearing Laravel cache.
pause
exit /b 1
