# Admin Permission-Aware Workspace

هذا التعديل يجعل لوحة الـAdmin تتشكل من الصلاحيات الفعلية المخزنة للحساب بدل افتراض أن كل Admin يرى كل شيء.

## السلوك
- `/admin` متاح لأي Admin فعّال، لكنه يعرض فقط الأقسام المسموح بها.
- لا يتم طلب `/api/dashboard` إذا الحساب لا يملك `analytics.view`، لذلك لا يظهر خطأ 403 داخل اللوحة.
- الصفحات التشغيلية نفسها محمية من السيرفر:
  - `/admin/orders` -> `orders.view`
  - `/admin/products` -> `products.view`
  - `/admin/team` -> `team.view`
  - `/admin/operations` -> `finance.view`
  - `/admin/marketing` -> `analytics.view`
  - `/delivery` -> واحدة من صلاحيات التوصيل المناسبة.
- `/auth/session` يعيد `effective_permissions` حتى تبني الواجهة نفسها على نفس قرار الـBackend.
- بيانات Dashboard الحساسة تُقص حسب الصلاحيات: الطلبات الحديثة تحتاج `orders.view`، الفريق يحتاج `team.view`، والماليات تحتاج `finance.view`.

## مبدأ الأمان
إخفاء المربع بالواجهة ليس الحماية الأساسية. المسار والـAPI محميان أيضًا في Laravel Middleware.
