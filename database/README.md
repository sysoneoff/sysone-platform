# SysOne D1 schema

`schema.sql` is the master relational foundation for the SysOne Cloudflare D1 database.

It covers:
- SysOne ID and account linking
- organizations and members
- products and games as catalog products
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

Production data services use the configured `SYSONE_DB` Cloudflare D1 binding. Public catalog and authenticated account, support, product and project flows use database-backed services where implemented.

`seed.sql` contains controlled initial catalog records and status metadata. It is not runtime demo catalog data. Planned or unavailable capabilities must remain explicitly marked with statuses such as `COMING_SOON`, `BETA` or `Planned` instead of being presented as live functionality.
