# Role dashboards and storefront access

Every role has a dedicated dashboard:

- Owner: `/owner`
- Admin: `/admin`
- Delivery: `/delivery`
- Customer: `/customer`

For Admin and Delivery accounts, the Owner can choose one of two workspace modes while creating or editing the account:

1. **Dashboard only**: the account is redirected back to its work dashboard when it tries to open public storefront pages.
2. **Dashboard + storefront**: the account can browse the public store while remaining signed in.

The `storefront_access` flag is Owner-controlled. A delegated Admin may create lower accounts when permitted, but cannot grant storefront access. Customer accounts always retain storefront access.
