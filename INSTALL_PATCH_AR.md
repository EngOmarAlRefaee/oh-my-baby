# OH MY BABY — Admin workspace / audit / product-entry patch

## Files
Copy these files over the matching files in your existing frontend source tree:
- `AdminDashboardPage.jsx`
- `TeamManagementPage.jsx`
- `AdminPage.jsx`

The source archive supplied for this patch flattens paths, so place each file at the same path as its current counterpart (do not extract the archive blindly into the project root).

## Changes
- Admin dashboard adopts the same rounded workspace shell and card rhythm as the Owner dashboard. Existing permission checks and API data flow are retained; role permissions are not broadened.
- Owner audit log renders known action codes as readable labels, with Arabic/English labels and a humanized fallback for unknown codes.
- Product wizard asks for Arabic name and description only and no longer requires English name entry. Existing English values are preserved for products already translated.

## Important translation limitation
This project snapshot contains separate `nameEn` / `descriptionEn` fields for storefront products, but no configured translation provider/service for generating real English translations from arbitrary Arabic product text. This patch therefore does **not** claim to auto-translate: for newly entered products, the English fields use Arabic as a fallback until a translation provider is connected or translations are supplied. The requested true automatic translation needs a provider/API and credentials; I did not add a paid/external service or expose secrets.

## Verify
1. Back up the three existing files.
2. Replace them at their existing source paths.
3. Run `npm run build`.
4. Test as Owner and Admin: dashboard sections should be aligned while each role still sees only permitted modules.
5. In Owner > Team, check audit labels in Arabic and English.
6. Add a product with Arabic-only text and confirm save/storefront compatibility. Verify English storefront text separately; it will remain a fallback, not an actual translation, until a provider is configured.
