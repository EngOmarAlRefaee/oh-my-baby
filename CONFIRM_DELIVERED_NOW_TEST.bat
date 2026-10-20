@echo off
cd /d "%~dp0"
echo === تأكيد استلام الطلبات المسلّمة فوراً (للتجربة فقط: ساعات=0) ===
php artisan omb:auto-confirm-receipts --hours=0
pause
