# OMB Auth Hover Fix V4

الإصلاح النهائي لبطاقات تسجيل الدخول في Dark Mode:

- لم يعد Hover يغيّر خلفية البطاقة أو لون النص، لذلك لا يختفي النص في الوضع الداكن.
- الدوائر الثلاث تبقى بنفس اللون الفاتح الثابت.
- Google غير المفعّل يبقى واضحًا كحالة Disabled عبر تخفيف النص فقط، وليس الدائرة كاملة.

## التركيب
انسخ محتويات ZIP فوق مجلد `website` مع Replace ثم نفّذ:

```powershell
php artisan optimize:clear
npm run build
```

لا يوجد migrate.
