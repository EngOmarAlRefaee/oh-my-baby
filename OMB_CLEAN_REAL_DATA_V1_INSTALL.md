# OH MY BABY — Clean Real Data V1

هذا التعديل يحضّر المتجر للبيانات الحقيقية بدون حذف الحسابات أو الصلاحيات.

## ماذا ينظف
- المنتجات القديمة/الوهمية من `products` و `catalog_products`.
- الطلبات التجريبية وعناصرها.
- عمولات/حصص/تسويات الاختبار والسجل المالي المرتبط بها.
- Wishlist وReviews المرتبطة بالمنتجات التجريبية.
- صور المنتجات في:
  - `public/images/products`
  - `public/uploads/products`
  - `storage/app/public/products`
- كاش المنتجات/السلة/المفضلة القديم في localStorage ينظف مرة واحدة تلقائياً عند فتح الموقع بعد Build.
- تم إلغاء الرجوع التلقائي إلى `mockProducts`، لذلك المتجر يبدأ فارغاً إلى أن يضيف Admin منتجات حقيقية.

## ماذا لا يحذف
- Users / Owner / Admin / Customer / Delivery.
- Roles, permissions, Data Scope.
- إعدادات النظام.
- محادثات الدعم.
- بيانات الحسابات.

## الأمان
قبل الحذف الفعلي، الأمر ينشئ Backup JSON للبيانات وصور المنتجات تحت:
`storage/app/omb-reset-backups/<timestamp>`

## التثبيت والتنظيف
بعد Replace داخل `website`:

```powershell
php artisan optimize:clear
npm run build
php artisan omb:reset-commerce
```

الأمر الأخير بدون `--force` يعرض فقط ما سيتم حذفه ولا يحذف شيئاً.

إذا الأرقام صحيحة، نفّذ:

```powershell
php artisan omb:reset-commerce --force
php artisan optimize:clear
```

بعدها اعمل `Ctrl+F5` مرة واحدة في المتصفح.
