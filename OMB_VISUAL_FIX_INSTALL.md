# OH MY BABY — Visual quick fix

التعديل يحتوي فقط على إصلاحين بصريين:

1. دائرة الأيقونة داخل نافذة تسجيل الدخول لا تتحول إلى أسود عند Hover في Dark Mode.
2. صفحة `/owner/team` أصبحت أضيق ومنظمة عمودياً بدون تمدد أفقي مزعج، مع منع الـ horizontal overflow.

## التركيب
فك الضغط داخل مجلد `website` واعمل Replace للملفات الموجودة.

ثم نفّذ:

```powershell
php artisan optimize:clear
npm run build
```

لا يوجد Migration.
