# SysOne Platform v2 — Production-Ready Public Foundation

This repository is the first implementation pass of the SysOne master plan.

**Brand position:** Software • AI • Games • Digital Products

## What is implemented in this foundation

- Premium liquid-tech visual system (dark/light theme, restrained gradients, soft reflections, vector-first icon language)
- Responsive home page
- Solutions
- Software products and product detail routes
- SysOne Games and game detail routes
- Marketplace foundation
- SysOne AI page + interactive local Project Planner preview
- Resources, Labs, Documentation and Support
- Pricing, About and multi-step Project Request UX
- SysOne ID login UX foundation for Google + Telegram
- User Account dashboard UX
- Private Control Center UI foundation
- Feature flags preview
- Status, legal and case-study pages
- PWA manifest + small offline shell service worker
- Sitemap and robots rules
- 5-language architecture foundation: UZ / EN / RU / TR / AR, including RTL direction switching (full content translation is a later milestone)
- Cloudflare Workers/OpenNext deployment configuration
- Cloudflare D1 master SQL schema for future production backend
- Brand assets for primary, symbol, horizontal, monochrome and app-icon usage

## Important production boundaries

The foundation intentionally does **not fake** sensitive production functionality.

These items are UI/architecture-ready but still require real infrastructure/configuration:

- Google OAuth
- Telegram login signature verification
- Account linking and session storage
- D1 database queries
- R2 secure downloads and signed URLs
- Click/Payme/payment provider integrations
- license activation service
- real support ticket persistence
- AI provider/grounded knowledge integration
- admin server-side RBAC + admin 2FA/passkeys
- analytics/event pipeline
- notifications via email/Telegram/push
- game profiles, cloud saves, achievements and multiplayer services
- seller marketplace/community modules

## Local development

```bash
npm install
npm run verify
npm run typecheck
npm run dev
```

Open: `http://localhost:3000`

## Cloudflare production preview

The project uses the current Cloudflare OpenNext Workers model.

Production build check:

```bash
npm run build
```

Cloudflare preview:

```bash
npm run preview
```

Deploy:

```bash
npm run deploy
```

For Windows development, normal `npm run dev` is recommended. Production-like OpenNext/Workers preview is safest through WSL or CI if Windows-specific adapter issues appear.

## Planned Cloudflare architecture

- Workers: Next.js full-stack app/API
- D1: structured application data
- R2 `sysone-assets`: public/media assets
- R2 `sysone-downloads`: protected software/game builds
- KV `sysone-config`: feature flags, cache and public configuration
- Cloudflare DNS/CDN/SSL: `sysone.uz` and subdomains

Suggested domains:

- `sysone.uz` — public platform
- `games.sysone.uz` — future game portal if separated
- `api.sysone.uz` — future API edge
- `downloads.sysone.uz` — signed download delivery
- `docs.sysone.uz` — optional documentation portal
- `status.sysone.uz` — optional status portal

## Next implementation milestone

1. Create Cloudflare account/resources and D1/R2/KV bindings.
2. Connect D1 repository layer to catalog/users/orders/projects.
3. Implement SysOne ID: Google + Telegram + account linking.
4. Replace the current production-disabled `/control-center` preview gate with real server-side roles and admin 2FA/passkeys.
5. Add R2 upload/download service with entitlement checks and short-lived signed URLs.
6. Connect project request/support forms to D1 and notifications.
7. Move content from demo files into Control Center CMS.
8. Expand translations into SEO-friendly localized routes.
9. Add verified SysOne AI knowledge and provider abstraction.
10. Connect payment providers only after merchant credentials are available.


## First public deploy safety

The first deployment intentionally uses only the minimal Worker + static assets configuration. D1, R2 and KV bindings are commented out until the actual resources exist, so a missing binding cannot break the first deploy.

`/control-center` is **disabled in production by default**. Set `ENABLE_CONTROL_CENTER_PREVIEW=true` only for a temporary private preview; do not use that flag as real authentication.

Before the first public deploy, set `NEXT_PUBLIC_SITE_URL` to the exact Workers URL in the Cloudflare build variables, then rebuild. This keeps canonical URLs, sitemap and social metadata correct.

The service worker never caches `/api`, `/login`, `/account` or `/control-center`, preventing private/dynamic areas from being stored in the public offline cache.
