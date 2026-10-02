import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type Announcement = {
  id: string;
  label: string | null;
  title: string;
  href: string | null;
  style: string;
  priority: number;
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  label: string | null;
  title: string;
  href: string | null;
  style: string;
  priority: number;
  enabled: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

function db() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function mapRow(row: Row): Announcement {
  return {
    id: row.id,
    label: row.label,
    title: row.title,
    href: row.href,
    style: row.style,
    priority: row.priority,
    enabled: row.enabled === 1,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublicAnnouncements(limit = 8) {
  const result = await db().prepare(
    `SELECT id,label,title,href,style,priority,enabled,starts_at,ends_at,created_at,updated_at
     FROM announcements
     WHERE enabled = 1
       AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now'))
       AND (ends_at IS NULL OR datetime(ends_at) > datetime('now'))
     ORDER BY priority DESC, updated_at DESC
     LIMIT ?`,
  ).bind(Math.max(1, Math.min(limit, 20))).all<Row>();
  return (result.results ?? []).map(mapRow);
}

export async function listAdminAnnouncements() {
  const result = await db().prepare(
    `SELECT id,label,title,href,style,priority,enabled,starts_at,ends_at,created_at,updated_at
     FROM announcements
     ORDER BY priority DESC, updated_at DESC`,
  ).all<Row>();
  return (result.results ?? []).map(mapRow);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function nullable(value: unknown, max: number) {
  const valueText = text(value, max);
  return valueText || null;
}

function normalize(input: Record<string, unknown>) {
  const title = text(input.title, 180);
  if (!title) throw new Error("title_required");
  const style = (text(input.style, 20) || "DEFAULT").toUpperCase();
  if (!["DEFAULT","NEW","UPDATE","GAME","APP","SALE"].includes(style)) {
    throw new Error("invalid_style");
  }
  const priority = Number(input.priority ?? 0);
  if (!Number.isInteger(priority) || priority < -1000 || priority > 1000) {
    throw new Error("invalid_priority");
  }
  const href = nullable(input.href, 500);
  if (href && !href.startsWith("/") && !/^https:\/\/[^\s]+$/i.test(href)) {
    throw new Error("invalid_href");
  }
  return {
    label: nullable(input.label, 32),
    title,
    href,
    style,
    priority,
    enabled: Boolean(input.enabled ?? true),
    startsAt: nullable(input.startsAt, 40),
    endsAt: nullable(input.endsAt, 40),
  };
}

export async function createAnnouncement(input: Record<string, unknown>) {
  const v = normalize(input);
  const id = crypto.randomUUID();
  await db().prepare(
    `INSERT INTO announcements
     (id,label,title,href,style,priority,enabled,starts_at,ends_at,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
  ).bind(
    id, v.label, v.title, v.href, v.style, v.priority, v.enabled ? 1 : 0,
    v.startsAt, v.endsAt,
  ).run();
  return getAnnouncement(id);
}

export async function getAnnouncement(id: string) {
  const row = await db().prepare(
    `SELECT id,label,title,href,style,priority,enabled,starts_at,ends_at,created_at,updated_at
     FROM announcements WHERE id = ? LIMIT 1`,
  ).bind(id).first<Row>();
  return row ? mapRow(row) : null;
}

export async function updateAnnouncement(id: string, input: Record<string, unknown>) {
  const v = normalize(input);
  await db().prepare(
    `UPDATE announcements SET
      label=?, title=?, href=?, style=?, priority=?, enabled=?,
      starts_at=?, ends_at=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`,
  ).bind(
    v.label, v.title, v.href, v.style, v.priority, v.enabled ? 1 : 0,
    v.startsAt, v.endsAt, id,
  ).run();
  return getAnnouncement(id);
}

export async function deleteAnnouncement(id: string) {
  const result = await db().prepare("DELETE FROM announcements WHERE id=?").bind(id).run();
  return Number(result.meta.changes ?? 0) > 0;
}
