OH MY BABY - Admin recovery patch

This patch restores ONLY the original local SQLite database that contained the Owner/Admin/Delivery demo accounts.
It does not overwrite React, Laravel controllers, styles, or any other code.

Steps (inside your website project folder):
1. Stop the dev server.
2. If database/database.sqlite exists, make a backup copy first.
3. Extract this ZIP into the project root so database/database.sqlite is restored.
4. Run: php artisan migrate
5. Run: php artisan optimize:clear
6. Start the project again.

Do NOT run php artisan migrate:fresh.
