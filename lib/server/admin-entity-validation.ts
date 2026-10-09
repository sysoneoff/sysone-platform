/** V4.4: domain-independent, testable validation for the legacy entity editor.
 * Sensitive role and payment/entitlement operations need dedicated workflows.
 */
export type EntityFieldType = "text" | "nullableText" | "number" | "boolean";
export type ValidatedValue = string | number | null;

const VALID_UPPER_TOKEN = /^[A-Z][A-Z0-9_]{0,39}$/;
const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_LOCALE = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/;
const SENSITIVE_FIELDS = new Set(["role", "owner_user_id", "payment_reference", "paid_at"]);

function fail(field: string): never {
  throw new Error(`invalid_${field}`);
}

export function validateEntityChanges(
  entity: string,
  editable: Record<string, EntityFieldType>,
  changes: unknown,
): Record<string, ValidatedValue> {
  if (!changes || Array.isArray(changes) || typeof changes !== "object") fail("changes");
  const entries = Object.entries(changes);
  if (!entries.length || entries.length > 30) fail("changes");
  const validated: Record<string, ValidatedValue> = {};

  for (const [field, raw] of entries) {
    const type = Object.prototype.hasOwnProperty.call(editable, field) ? editable[field] : undefined;
    if (!type || SENSITIVE_FIELDS.has(field)) fail(`field_${field.replace(/[^a-z0-9_]/gi, "_").slice(0, 50)}`);

    if (type === "boolean") {
      if (typeof raw === "boolean") validated[field] = raw ? 1 : 0;
      else if (raw === 0 || raw === 1) validated[field] = raw;
      else fail(field);
      continue;
    }

    if (type === "number") {
      const n = typeof raw === "number" ? raw :
        typeof raw === "string" && /^-?\d+(?:\.\d+)?$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
      if (!Number.isFinite(n) || !Number.isSafeInteger(n)) fail(field);
      if (field === "device_limit" && (n < 1 || n > 100)) fail(field);
      if (field === "progress" && (n < 0 || n > 100)) fail(field);
      validated[field] = n;
      continue;
    }

    if (type === "nullableText" && (raw === null || raw === "")) {
      validated[field] = null;
      continue;
    }
    if (typeof raw !== "string" || raw.length > 4000) fail(field);
    const value = raw.trim();
    if (value.length === 0 && ["name", "slug", "title", "subject"].includes(field)) fail(field);
    if (field === "slug" && !VALID_SLUG.test(value)) fail(field);
    if (field === "locale" && !VALID_LOCALE.test(value)) fail(field);
    if ((field === "status" || field === "priority") && !VALID_UPPER_TOKEN.test(value)) fail(field);
    if (field === "config_json" || field === "value_json") {
      try { JSON.parse(value); } catch { fail(field); }
    }
    if (field === "read_at" || field === "expires_at" || field === "ends_at" || field === "last_seen_at") {
      if (value && Number.isNaN(Date.parse(value))) fail(field);
    }
    validated[field] = type === "nullableText" && !value ? null : value;
  }
  // The caller may use entity to add future domain-specific invariants.
  void entity;
  return validated;
}
