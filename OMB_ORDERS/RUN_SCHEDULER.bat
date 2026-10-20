@echo off
cd /d "%~dp0"
echo === تشغيل جدولة المهام (تأكيد الاستلام التلقائي بعد 12 ساعة). اترك هذه النافذة مفتوحة ===
php artisan schedule:work
