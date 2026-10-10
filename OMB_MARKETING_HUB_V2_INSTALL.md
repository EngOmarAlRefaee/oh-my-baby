# OMB Marketing Hub V2

## التعديل
- عند فتح `/owner/marketing` أو `/admin/marketing` تظهر أولاً لوحة مربعات مثل لوحة Owner.
- كل ميزة تفتح لوحدها داخل نفس الصفحة:
  - إيميلات وأرقام الزبائن
  - إرسال بريد جماعي
  - إرسال WhatsApp جماعي
  - سجل الرسائل الجماعية
  - العروض وكود الحسم
  - نتائج الاستفتاءات
- المربعات تظهر حسب صلاحيات الحساب؛ Owner يرى الكل.
- لا تغيير على Backend أو قاعدة البيانات.

## التثبيت
فك الضغط داخل مجلد `website` واعمل Replace ثم:

```powershell
php artisan optimize:clear
npm run build
```

لا يوجد `migrate`.
