# OMB Auth Hover Fix V3

هذا الإصلاح لا يعتمد على ألوان Tailwind المتغيرة مع Dark Mode.
تمت إزالة `bg-oat` / `text-espresso` من دائرة أيقونة خيارات تسجيل الدخول، ووضع لون ثابت inline حتى لا تستطيع قواعد Dark Mode ذات `!important` تحويل الدائرة إلى الأسود.

## التثبيت
فك الضغط داخل مجلد `website` مع Replace ثم نفذ:

```powershell
php artisan optimize:clear
npm run build
```

لا يوجد migrate.
