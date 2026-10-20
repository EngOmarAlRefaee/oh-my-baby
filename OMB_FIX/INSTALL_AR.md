# OMB_FIX — تركيب

1. انسخ المجلدات `resources` و `tests` فوق مجلد المشروع (استبدل الملفات).
2. شغّل:  `npm run build`
3. شغّل:  `php artisan test --filter=OrderStockVisibilityTest`  ثم `php artisan test`
4. افتح الموقع بنافذة خاصة (Ctrl+Shift+N) وتأكد من ظهور المنتجات بحساب الزبون.

## الملفات المعدلة
- resources/js/data/productStore.js — دالة syncCatalogFromServer (الـ DB مصدر المنتجات والمخزون)
- resources/js/app.jsx — مزامنة الكتالوج قبل رسم المتجر
- resources/js/components/CheckoutPage.jsx — مزامنة المخزون بعد نجاح الطلب
- resources/js/components/AdminPage.jsx — توحيد خلفية صور المنتجات عند الرفع (ما عدا قسم decor)
- resources/js/components/product/ProductCard.jsx — خلفية البطاقة بنفس اللون
- tests/Feature/OrderStockVisibilityTest.php — اختبارات جديدة

## الرجوع للخلف
ارجع للملفات القديمة وأعد `npm run build`. لا يوجد migration ولا تغيير بقاعدة البيانات.

## ملاحظة
الصور المرفوعة قبل هالتعديل ما بتتغير؛ أعد رفعها لتتوحد خلفيتها.
