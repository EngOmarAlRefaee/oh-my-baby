# OMB_SITE_CONTENT — تعديل قسم الموسم/الترند من الأدمن

1. انسخ الملفات فوق المشروع.
   تنبيه: routes/web.php و app/Support/PermissionCatalog.php و resources/js/app.jsx و AdminDashboardPage.jsx و workspaceModules.js استبدال كامل لنسخ بعتّها قبل؛ إذا عدّلتهم بعدها ادمج التعديلات يدوياً (كلها إضافات صغيرة، ابحث عن site_content / SiteContent / site-content).
2. `php artisan migrate`  (ينشئ جدول site_sections فقط، ما بيلمس بيانات موجودة)
3. `npm run build`  ثم  `php artisan test --filter=SiteContentTest`
4. من الأونر: الحسابات والصلاحيات ← اختر الأدمن ← مجموعة «محتوى الموقع (الموسم والترند)» ← فعّل «تعديل قسم الموسم...».
5. الأدمن (أو الأونر) يفتح: /admin/site-content (أو بطاقة «محتوى الموقع» بلوحته).

## ملاحظات
- أول ما تحفظ، الموقع بيعرض النص الجديد؛ قبل الحفظ بيعرض النص الافتراضي (العودة إلى المدرسة).
- النص عربي فقط؛ الإنكليزي بيتولّد وقت الحفظ بمترجم Chrome (سطح المكتب)، وإذا ما توفر بيظهر العربي.
- الصورة بترفع على /public/uploads/site (jpg/png/webp حتى 8MB).
- الروابط لازم تبدأ بـ / أو http(s):// (حماية).
## الرجوع
أعد الملفات القديمة، ولو بدك احذف الجدول: php artisan migrate:rollback --step=1 (بس إذا هي آخر migration).
