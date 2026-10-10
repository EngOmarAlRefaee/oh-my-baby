# OH MY BABY — Admin Personal Commissions Permissions V1

## ماذا يتغير
- إزالة صلاحيات `Sham Cash والعمولات التشغيلية` من قائمة صلاحيات Admin.
- `finance.view` و `finance.transfer` تبقيان فعلياً للـOwner فقط لأن الـOwner يملك صلاحية `*`، ولا يستطيع Admin جديد أخذها من شاشة الصلاحيات.
- إضافة قسم جديد للأدمن باسم `عمولاتي ومستحقاتي` وفيه:
  - `commissions.self.view` — مشاهدة ملخص عمولاته ومستحقاته الشخصية.
  - `commissions.self.orders` — مشاهدة تفاصيل الطلبات وحصته من عمولة كل طلب.
  - `commissions.self.settlements` — مشاهدة المدفوع والمتبقي وسجل تسوياته الشخصية.
- صلاحيات التفاصيل والتسويات تعتمد تلقائياً على صلاحية مشاهدة الملخص.

## التثبيت
فك الضغط داخل مجلد `website` واعمل Replace، ثم:

```powershell
php artisan optimize:clear
npm run build
php artisan test --filter=TeamManagementSecurityTest
php artisan test --filter=DataScopeDelegationTest
```

لا يوجد `migrate` في هذا التعديل.

## ملاحظة
هذا التعديل يضيف/يرتب الصلاحيات فقط. صفحة الأرقام الفعلية للعمولات (المستحق/المدفوع/المتبقي/تفاصيل الطلبات) سيتم ربطها بمنطق العمولات في الخطوة التالية.
