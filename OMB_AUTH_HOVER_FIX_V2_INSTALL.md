# OH MY BABY — Auth hover fix v2

إصلاح بصري فقط لدائرة الأيقونة داخل نافذة الحساب.

- عند Hover تبقى الدائرة فاتحة في Light/Dark Mode.
- لا يوجد Migration.

بعد Replace:

```powershell
php artisan optimize:clear
npm run build
```
