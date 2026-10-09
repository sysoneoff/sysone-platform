#!/usr/bin/env python3
"""Read-only HTTP smoke checks for the private SysOne V4.4 localhost staging Worker.

The only POST creates an admin cookie; no staging D1/R2 writes or production calls.
Never display the secret or session cookie.
"""
from __future__ import annotations

import argparse
import getpass
import http.client
import json
import os
import re
import sys
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import quote

HOST = "127.0.0.1"
PORT = 8787
ORIGIN = f"http://{HOST}:{PORT}"
ADMIN_COOKIE = "sysone_admin_session"
MAX_BODY = 2 * 1024 * 1024


class SmokeError(RuntimeError):
    pass


def config_check(root: Path) -> None:
    p = root / "wrangler.staging.jsonc"
    if not p.is_file():
        raise SmokeError("Missing wrangler.staging.jsonc. Run from sysone-platform repo.")
    conf = json.loads(p.read_text(encoding="utf-8-sig"))
    if conf.get("name") != "sysone-v44-staging" or conf.get("workers_dev") is not False or conf.get("routes") != []:
        raise SmokeError("Unsafe staging config: wrong name or public routes.")
    dbs = conf.get("d1_databases", [])
    if len(dbs) != 1 or dbs[0].get("database_name") != "sysone-v44-staging" or dbs[0].get("database_id") != "b11a5541-dd90-461c-af0d-b81d3981ca1e" or dbs[0].get("remote") is not True:
        raise SmokeError("Wrong D1 binding. Refusing smoke check.")
    buckets = conf.get("r2_buckets", [])
    if len(buckets) != 1 or buckets[0].get("binding") != "SYSONE_ASSETS" or buckets[0].get("remote") is True or buckets[0].get("bucket_name") == "sysone-assets":
        raise SmokeError("Expected one local-only R2 binding for media.")


def http_json(method: str, path: str, *, cookie: str = "", secret: str = "", origin: str = ""):
    if not path.startswith("/") or path.startswith("//") or "?url=" in path.lower():
        raise SmokeError("Invalid local-only request path")
    headers = {"Accept": "application/json", "Host": f"{HOST}:{PORT}", "Cache-Control": "no-store"}
    if cookie:
        headers["Cookie"] = f"{ADMIN_COOKIE}={cookie}"
    body = None
    if method == "POST":
        if path != "/api/admin/session":
            raise SmokeError("Only admin session POST is allowed")
        body = json.dumps({"secret": secret}, separators=(",", ":")).encode("utf-8")
        headers.update({"Content-Type": "application/json", "Origin": origin or ORIGIN})
    if method not in ("POST", "GET"):
        raise SmokeError("Only safe HTTP methods are allowed")
    conn = http.client.HTTPConnection(HOST, PORT, timeout=20)
    try:
        conn.request(method, path, body=body, headers=headers)
        r = conn.getresponse()
        raw = r.read(MAX_BODY + 1)
        if len(raw) > MAX_BODY:
            raise SmokeError(f"Response too large for {path}")
        try:
            data = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            data = {}
        return r.status, data, r.getheader("Set-Cookie", "")
    except OSError as e:
        raise SmokeError(f"Cannot connect to localhost:{PORT}. Check wrangler dev. ({e.__class__.__name__})") from e
    finally:
        conn.close()


def ensure(status: int, expected: int, data: object, where: str) -> dict:
    if status != expected:
        reason = data.get("error", "unknown") if isinstance(data, dict) else "unknown"
        raise SmokeError(f"{where}: HTTP {status}, expected {expected}; error={reason}")
    if not isinstance(data, dict):
        raise SmokeError(f"{where}: JSON object expected")
    if expected == 200 and data.get("ok") is not True:
        raise SmokeError(f"{where}: JSON ok is not true")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="Safe read-only smoke checks against localhost:8787")
    parser.add_argument("--root", default=".", help="Local SysOne project root; default cwd")
    args = parser.parse_args()
    config_check(Path(args.root).resolve())
    print("PASS: private staging config, remote staging D1, local-only R2")

    code, data, _ = http_json("GET", "/api/admin/v4/orders")
    if code != 401 or data.get("error") != "unauthorized":
        raise SmokeError("Anonymous orders endpoint not protected with 401")
    print("PASS: anonymous Owner API returns 401")

    code, data, _ = http_json("GET", "/api/health")
    health = ensure(code, 200, data, "health")
    if health.get("database") != "connected" or not health.get("bindings", {}).get("assets"):
        raise SmokeError("Expected connected D1 and local media R2 binding")
    if health.get("bindings", {}).get("downloads") or health.get("bindings", {}).get("kv"):
        raise SmokeError("Unexpected download/KV binding exposed in isolated staging")
    print("PASS: health D1 connected / media binding ready / no production KV or downloads")

    secret = os.environ.get("STAGING_ADMIN_SECRET", "")
    if not secret:
        secret = getpass.getpass("Paste current LOCAL staging Admin secret (hidden): ")
    if len(secret) < 24:
        raise SmokeError("Admin secret is missing or too short (not printed)")
    try:
        code, data, set_cookie = http_json("POST", "/api/admin/session", secret=secret)
    finally:
        secret = ""  # avoid retaining extra references to key
    ensure(code, 200, data, "admin login")
    jar = SimpleCookie()
    try:
        jar.load(set_cookie)
    except Exception as e:
        raise SmokeError("Malformed admin Set-Cookie header") from e
    if ADMIN_COOKIE not in jar:
        raise SmokeError("Admin login did not set expected HttpOnly session cookie")
    morsel = jar[ADMIN_COOKIE]
    if not morsel["httponly"]:
        raise SmokeError("Admin cookie is not HttpOnly")
    token = morsel.value
    if len(token) < 20:
        raise SmokeError("Admin cookie is unexpectedly short")
    print("PASS: admin login accepted and secure session cookie present")

    checks = [
        ("session", "/api/admin/session"),
        ("analytics", "/api/admin/v4/analytics"),
        ("orders", "/api/admin/v4/orders"),
        ("customers", "/api/admin/v4/customers"),
        ("media", "/api/admin/media"),
        ("licenses", "/api/admin/v4/entities/licenses"),
        ("sessions", "/api/admin/v4/entities/sessions"),
        ("reviews", "/api/admin/v4/entities/reviews"),
        ("flags", "/api/admin/v4/entities/flags"),
    ]
    results = {}
    for name, path in checks:
        code, data, _ = http_json("GET", path, cookie=token)
        results[name] = ensure(code, 200, data, name)
        print(f"PASS: {name} GET 200")

    if results["session"].get("authenticated") is not True:
        raise SmokeError("Session endpoint reports unauthenticated")
    orders, customers = results["orders"], results["customers"]
    if not isinstance(orders.get("rows"), list) or not isinstance(customers.get("rows"), list):
        raise SmokeError("Orders/customers response shape is invalid")
    if not isinstance(orders.get("total"), int) or not isinstance(customers.get("total"), int):
        raise SmokeError("Missing order/customer totals")
    for kind in ("licenses", "sessions", "reviews", "flags"):
        if not isinstance(results[kind].get("rows"), list):
            raise SmokeError(f"{kind} missing rows array")
    if not isinstance(results["media"].get("assets"), list):
        raise SmokeError("media missing assets array")
    if len(results["analytics"].get("dailyOrders", [])) != 14:
        raise SmokeError("Analytics does not have 14 daily buckets")
    if not customers["rows"]:
        raise SmokeError("No staging customer available for Customer 360 test")
    customer_id = customers["rows"][0].get("id")
    if not isinstance(customer_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", customer_id):
        raise SmokeError("Unexpected customer ID format")
    code, customer, _ = http_json("GET", "/api/admin/v4/customers/" + quote(customer_id, safe=""), cookie=token)
    ensure(code, 200, customer, "Customer 360")
    if customer.get("customer", {}).get("id") != customer_id:
        raise SmokeError("Customer 360 did not return requested customer")
    print("PASS: Customer 360 matches requested user")
    print(f"INFO: staging users={customers['total']}, orders={orders['total']}, media={len(results['media']['assets'])}")
    if customers["total"] != 2 or orders["total"] != 6:
        print("NOTE: fixture counts differ from initial 2 users / 6 orders; review test changes")
    print("SMOKE PASS: read-only staging API checks complete. No deployments or data edits.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (SmokeError, OSError, ValueError, json.JSONDecodeError) as e:
        print("SMOKE FAIL: " + str(e), file=sys.stderr)
        sys.exit(1)
