# Staff workspace isolation

- Owner remains the root account and can still access the store when needed.
- Admin and Delivery accounts are work accounts, not customer browsing sessions.
- While an Admin is signed in, public storefront pages redirect to `/admin`.
- While a Delivery account is signed in, public storefront pages redirect to `/delivery`.
- Staff pages use a dedicated workspace header with Dashboard, language/theme controls and Sign out only.
- Signing out returns the browser to the public store.
- An Admin sees only workspace cards granted by permissions.
- `decoration.view` enables a dedicated `/admin/decoration` workspace, allowing an Admin account to be isolated to decoration only.
- Server-side permission middleware remains authoritative even if a URL is typed manually.
