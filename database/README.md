# SysOne D1 schema

`schema.sql` is the master relational foundation for the planned Cloudflare D1 database.

It covers:
- SysOne ID and account linking
- organizations and members
- products/games as marketplace products
- versions, files and secure distribution metadata
- orders, entitlements and licenses
- reviews and wishlists
- customer projects and milestones
- support tickets
- notifications
- CMS content versions
- feature flags
- audit logs
- AI usage accounting

The UI currently runs on demo catalog data. D1 integration should be enabled only after the production Cloudflare bindings and authentication layer are configured.
