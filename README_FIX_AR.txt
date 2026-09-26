إصلاح فتح صفحة /owner/team

المشكلة: app.jsx كان يفحص /owner قبل /owner/team، لذلك أي رابط يبدأ بـ /owner كان يعرض لوحة المالك.

التعديل:
1) إضافة TeamManagementPage إلى app.jsx.
2) فحص /owner/team قبل /owner.
3) إضافة بطاقة "الحسابات والصلاحيات" في لوحة الـOwner.

طريقة التركيب:
- فك الضغط.
- انسخ مجلد resources فوق مجلد website واعمل Replace.
- إذا npm run dev يعمل: اعمل Refresh.
- افتح: http://127.0.0.1:8000/owner/team
