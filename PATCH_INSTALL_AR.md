# OMB — Customer Support Chat v1

## الموجود في النسخة

- زر ثابت "تواصل معنا" على صفحات المتجر.
- الزائر يستطيع بدء محادثة بالاسم + الهاتف + الرسالة.
- الزائر يستطيع ربط المحادثة برقم طلب اختياري.
- Customer المسجل يملك قائمة محادثاته الخاصة.
- Customer يستطيع الضغط "استفسار عن هذا الطلب" من صفحة حسابه.
- تحديث تلقائي للمحادثة بدون WebSocket.
- Owner لديه صندوق محادثات كامل على:
  `/owner/support`
- Admin يظهر له قسم "محادثات العملاء" فقط إذا أعطاه Owner صلاحية `support.view`.
- صلاحيات مستقلة:
  - support.view
  - support.reply
  - support.assign
  - support.close
- عدادات للرسائل غير المقروءة.
- حالات المحادثة:
  - مفتوحة
  - بانتظار رد الزبون
  - مغلقة
- تعيين المحادثة لموظف دعم.
- إغلاق وإعادة فتح المحادثة.
- ربط اختياري بالطلب.
- حماية Backend للصلاحيات ولخصوصية المحادثات.

## التركيب

انسخ محتويات الحزمة فوق مجلد `website` واعمل Replace.

ثم شغّل:

```powershell
php artisan migrate
npm run build
php artisan optimize:clear
```

ثم الاختبارات:

```powershell
php artisan test --filter=SupportConversationTest
php artisan test --filter=TeamManagementSecurityTest
php artisan test --filter=AdminWorkspacePermissionTest
php artisan test --filter=StaffWorkspaceIsolationTest
php artisan test --filter=RoleDashboardStorefrontAccessTest
```

## اختبار أرض الواقع

1. افتح المتجر كزائر.
2. اضغط "تواصل معنا".
3. أرسل رسالة باسم + هاتف.
4. ادخل Owner وافتح `/owner/support`.
5. يجب أن تظهر المحادثة كغير مقروءة.
6. رد من Owner.
7. ارجع لنفس المتصفح كزائر، وافتح زر الدعم؛ يجب أن يظهر الرد.
8. جرّب إغلاق المحادثة.
9. من Owner أعط Admin صلاحية support.view فقط وتأكد أنه يشاهد بدون رد.
10. أضف support.reply وتأكد أن زر الرد يعمل.
11. من Customer افتح `/customer` واضغط "استفسار عن هذا الطلب" على أحد الطلبات.

ملاحظة: هذه النسخة لا تتضمن رفع صور/ملفات ولا WebSocket. التحديث الدوري هو المقصود في v1.
