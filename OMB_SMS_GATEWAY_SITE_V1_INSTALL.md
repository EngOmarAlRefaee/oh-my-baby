# OMB SMS Gateway — Site V1

## ماذا يضيف
- إرسال SMS جماعي من لوحة التسويق بدون مزود API مدفوع.
- الهاتف Android هو المرسل الحقيقي من شريحة SIM.
- كل حملة تحتاج تأكيد واحد فقط على الهاتف، وبعدها يكمل الهاتف كل الأرقام تلقائياً.
- رمز ربط من 6 أرقام صالح 10 دقائق، وبعده الهاتف يحتفظ بتوكن خاص به.
- سجل حالة الحملة: بانتظار التأكيد / إرسال / مكتمل / جزئي / فشل.
- صلاحيات Owner الجديدة:
  - `marketing.sms.send`
  - `marketing.sms.gateway.manage`
- إزالة WhatsApp من خيارات الصلاحيات الجديدة والواجهة؛ الكود القديم يبقى غير ظاهر ولا يؤثر.

## التثبيت
فك الملفات داخل مجلد `website` واعمل Replace ثم:

```powershell
php artisan migrate
php artisan optimize:clear
npm run build
php artisan test --filter=SmsGatewayTest
php artisan test --filter=TeamManagementSecurityTest
php artisan test --filter=DataScopeDelegationTest
```

## التجربة محلياً مع الهاتف
شغّل Laravel ليستقبل اتصالات من الشبكة المحلية:

```powershell
php artisan serve --host=0.0.0.0 --port=8000
```

على Windows نفّذ `ipconfig` وخذ IPv4 لجهاز الكمبيوتر، مثلاً `192.168.1.25`.
في تطبيق الهاتف استخدم:

```text
http://192.168.1.25:8000
```

الهاتف والكمبيوتر لازم يكونوا على نفس Wi‑Fi أثناء التطوير. لاحقاً بعد الاستضافة تستخدم رابط HTTPS الحقيقي.
