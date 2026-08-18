# SysOne v2 — pre-push / pre-deploy checklist

Run these commands from the project root on your PC before pushing:

```bash
npm install
npm run verify
npm run typecheck
npm run build
npm run preview
```

Only push/deploy if all five complete without errors.

## First Cloudflare deploy

1. Keep D1/R2/KV bindings commented out until those resources are actually created.
2. Keep `ENABLE_CONTROL_CENTER_PREVIEW=false` in production.
3. Set `NEXT_PUBLIC_SITE_URL` to the exact public Workers URL in Cloudflare build variables before the final production build.
4. Deploy with `npm run deploy` or connect the GitHub repo to Workers Builds.
5. After deploy, test `/`, `/solutions`, `/products`, `/games`, `/marketplace`, `/ai`, `/resources`, `/docs`, `/support`, `/contact`, `/login`, `/account`, `/status`.
6. Confirm `/control-center` returns 404 in production until real authentication/RBAC is implemented.
7. Confirm PWA install works and private routes are not available offline.

## Not yet production-enabled by design

Google OAuth, Telegram authentication, real account sessions, D1 persistence, R2 protected downloads, payments, license activation, persistent support tickets, grounded AI, admin RBAC/2FA, game cloud services and full five-language content are future integration milestones. Their UI/foundation exists, but this public foundation does not pretend they are live.
