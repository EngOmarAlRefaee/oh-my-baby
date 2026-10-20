@echo off
cd /d "%~dp0"
echo === OH MY BABY: تطبيق التحديثات (آمن، لا يحذف بيانات) ===
php artisan migrate --force
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
echo.
echo خلص. اغلق هذه النافذة وحدّث المتصفح.
pause
