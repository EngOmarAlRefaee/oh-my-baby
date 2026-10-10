# OMB SMS Gateway — Test Fix 1

الإصلاح خاص بالاختبار فقط: تمت إزالة `is_active` من بيانات User التي ينشئها `SmsGatewayTest` لأن قاعدة SQLite المؤقتة المستخدمة في الاختبار لا تحتوي هذا العمود.

## التثبيت
فك الملف داخل مجلد `website` واعمل Replace.

ثم نفّذ:

```powershell
php artisan optimize:clear
php artisan test --filter=SmsGatewayTest
```

لا يوجد migrate ولا npm build لهذا الإصلاح.
