# OMB Marketing Broadcasts V1

## ماذا يتغير
- إزالة Newsletter من الصفحة الرئيسية.
- Owner: قسم التسويق يفتح صفحة التسويق الفعلية.
- قائمة كل إيميلات وأرقام Customer المسجلة.
- الإرسال الجماعي يستخدم فقط الحسابات التي وافقت على marketing_opt_in.
- صندوق رسالة جماعية للبريد.
- صندوق رسالة جماعية لـ WhatsApp.
- سجل عمليات الإرسال.
- صلاحيات جديدة تظهر تلقائياً في Wizard إنشاء/تعديل الحساب:
  - marketing.contacts.view
  - marketing.email.send
  - marketing.whatsapp.send

## التثبيت
بعد Replace نفّذ:

```powershell
php artisan migrate
php artisan optimize:clear
npm run build
php artisan test --filter=TeamManagementSecurityTest
php artisan test --filter=DataScopeDelegationTest
```

## البريد
يستخدم إعداد البريد الحالي في Laravel (`MAIL_*`).

## WhatsApp Business
أضف لاحقاً في `.env` بعد إنشاء WhatsApp Business Platform:

```env
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_VERSION=v23.0
```

اسم النشاط OH MY BABY يتم ضبطه واعتماده من Meta Business، وليس من داخل كود الموقع.

ملاحظة: حملات WhatsApp الخارجة قد تتطلب Template معتمد من Meta حسب نوع الرسالة وحالة نافذة المحادثة.
