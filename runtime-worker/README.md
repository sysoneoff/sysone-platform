# SysOne Runtime Worker

Separate runtime for uploaded Web Apps / Web Games.

Routes:
- `GET /health`
- `GET /start/:slug?token=...`
- `GET /app/:slug/*`

The Worker reads active builds from the shared SysOne D1 database and serves static files from the `sysone-runtime` R2 bucket.

For protected products, set the same `SYSONE_RUNTIME_SECRET` secret on this Worker and on the main `sysone-platform` Worker.

Web bundles must contain `index.html` at ZIP root and should use **relative asset URLs**. For Vite, set `base: "./"`.
