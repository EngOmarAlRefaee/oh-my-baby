# Owner Workspace UI

## Purpose
The Owner dashboard is the root navigation layer of the system. It uses 12 stable module names. Future Admin/Delivery workspaces should reuse the same module registry and reveal only modules/items allowed by backend permissions and visibility rules.

## The 12 modules
1. Owner account
2. Accounts & permissions
3. Orders
4. Products & inventory
5. Decoration
6. Delivery
7. Marketing & offers
8. Finance & commissions
9. Customers
10. Reports & analytics
11. System & security
12. Help & system guide

## Security rule
Hiding a module is UX, not authorization. Every protected API/route must remain guarded on the backend.

## Future account rendering
Each account should eventually be evaluated against:
- Role
- Action permissions
- Visibility permissions
- Data scope
- Delegation limits

The Owner is the root of the permission/delegation tree. Owner-only financial ownership and sensitive system powers remain protected even if an Admin receives broad operational access.
