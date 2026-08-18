import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "app/manifest.ts",
  "app/robots.ts",
  "app/sitemap.ts",
  "public/sw.js",
  "public/brand/sysone-symbol.png",
  "public/brand/sysone-horizontal.png",
  "public/brand/sysone-app-icon.png",
  "wrangler.jsonc",
  "open-next.config.ts",
  "next.config.ts",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Missing required files:\n" + missing.map((x) => `- ${x}`).join("\n"));
  process.exit(1);
}

const textRoots = ["app", "components", "lib", "data"];
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(file);
  }
}
for (const dir of textRoots) walk(path.join(root, dir));

const forbidden = [];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (/href=["']#["']/.test(source)) forbidden.push(`${path.relative(root, file)}: dead href #`);
  if (/export\s+const\s+runtime\s*=\s*["']edge["']/.test(source)) forbidden.push(`${path.relative(root, file)}: edge runtime is not supported by OpenNext Cloudflare`);
}
if (forbidden.length) {
  console.error("Verification failed:\n" + forbidden.map((x) => `- ${x}`).join("\n"));
  process.exit(1);
}

const wrangler = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
if (wrangler.includes("WORKER_SELF_REFERENCE")) {
  console.error("Verification failed: first deploy must not require WORKER_SELF_REFERENCE.");
  process.exit(1);
}

console.log(`SysOne verification passed (${sourceFiles.length} TS/TSX files checked).`);
