# OMB — Support Chat v2

هذه الحزمة تحول نظام الدعم الموجود إلى محادثة أقرب للشات الطبيعي:

- Reply على رسالة محددة مع اقتباسها.
- علامات إرسال/قراءة.
- Auto-scroll لآخر رسالة.
- الزبون يستطيع إعادة فتح المحادثة المغلقة بمجرد إرسال رسالة جديدة.
- حماية تمنع Reply على رسالة من محادثة أخرى.

## التركيب

فك الضغط فوق مجلد `website` واعمل Replace.

ثم:

```powershell
php artisan migrate
php artisan optimize:clear
npm run build
php artisan test --filter=SupportConversationTest
```

إذا الاختبار PASS، جرّب يدوياً:

1. Customer يرسل رسالة.
2. Owner يفتح `/owner/support` ويرد عليها.
3. اضغط `رد` على رسالة قديمة من الطرفين وتأكد أن الاقتباس يظهر.
4. افتح الرد عند الطرف الثاني وتأكد أن `✓✓` تظهر بعد القراءة.
5. Owner يغلق المحادثة، ثم Customer يرسل رسالة جديدة؛ يجب أن تعود الحالة `open` تلقائياً.
