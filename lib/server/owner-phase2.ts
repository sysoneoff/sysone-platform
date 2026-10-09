import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { getOwnerOverview } from "@/lib/server/admin-v4";
import { assertOwnerRecordId, type OwnerQuery } from "@/lib/owner-phase2-query";

function db() { return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB"); }

type CountRow = { total: number };
function filters(q: OwnerQuery, columns: string[]) {
  const clauses: string[] = [];
  const values: string[] = [];
  if (q.q) {
    clauses.push(`(${columns.map(column => `${column} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    const pattern = `%${q.q.replace(/[\\%_]/g, value => `\\${value}`)}%`;
    columns.forEach(() => values.push(pattern));
  }
  return { clauses, values };
}

export async function listOwnerOrders(query: OwnerQuery) {
  const { clauses, values } = filters(query, ["o.id", "u.name", "u.email"]);
  if (query.status) { clauses.push("o.status = ?"); values.push(query.status); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [count, result] = await Promise.all([
    db().prepare(`SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id=o.user_id ${where}`).bind(...values).first<CountRow>(),
    db().prepare(`SELECT o.id,o.user_id AS userId,u.name AS customerName,u.email AS customerEmail,
      o.status,o.subtotal_minor AS subtotalMinor,o.discount_minor AS discountMinor,o.total_minor AS totalMinor,
      o.currency,o.created_at AS createdAt,o.paid_at AS paidAt,
      (SELECT COUNT(*) FROM order_items i WHERE i.order_id=o.id) AS itemCount
      FROM orders o JOIN users u ON u.id=o.user_id ${where}
      ORDER BY o.created_at ${query.sort === "oldest" ? "ASC" : "DESC"},o.id DESC LIMIT ? OFFSET ?`)
      .bind(...values, query.size, query.offset).all<Record<string, unknown>>(),
  ]);
  return { rows: result.results ?? [], total: Number(count?.total ?? 0), page: query.page, size: query.size };
}

export async function getOwnerOrder(id: string) {
  assertOwnerRecordId(id);
  const order = await db().prepare(`SELECT o.id,o.user_id AS userId,u.name AS customerName,u.email AS customerEmail,
    o.status,o.subtotal_minor AS subtotalMinor,o.discount_minor AS discountMinor,o.total_minor AS totalMinor,
    o.currency,o.payment_provider AS paymentProvider,o.created_at AS createdAt,o.paid_at AS paidAt,
    CASE WHEN o.status='PENDING' AND o.paid_at IS NULL AND o.payment_reference IS NULL THEN 1 ELSE 0 END AS canCancel
    FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=? LIMIT 1`).bind(id).first<Record<string, unknown>>();
  if (!order) return null;
  const items = await db().prepare(`SELECT i.id,i.product_id AS productId,p.name AS productName,p.slug,
    i.quantity,i.unit_price_minor AS unitPriceMinor FROM order_items i
    JOIN products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY p.name LIMIT 100`).bind(id).all<Record<string, unknown>>();
  return { ...order, items: items.results ?? [] };
}

export async function cancelPendingOrder(id: string) {
  assertOwnerRecordId(id);
  // Deliberately refuses to transition a paid or payment-referenced order.
  const result = await db().prepare(`UPDATE orders SET status='CANCELLED'
    WHERE id=? AND status='PENDING' AND paid_at IS NULL AND payment_reference IS NULL`).bind(id).run();
  if (Number(result.meta.changes ?? 0) > 0) return true;
  const row = await db().prepare("SELECT status FROM orders WHERE id=? LIMIT 1").bind(id).first<{status:string}>();
  if (!row) throw new Error("order_not_found");
  throw new Error("order_not_cancellable");
}

export async function listOwnerCustomers(query: OwnerQuery) {
  const { clauses, values } = filters(query, ["u.name", "u.email", "u.id"]);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [count, result] = await Promise.all([
    db().prepare(`SELECT COUNT(*) AS total FROM users u ${where}`).bind(...values).first<CountRow>(),
    db().prepare(`SELECT u.id,u.name,u.email,u.role,u.locale,u.created_at AS createdAt,
       (SELECT COUNT(*) FROM orders o WHERE o.user_id=u.id) AS orderCount,
       (SELECT COUNT(*) FROM entitlements e WHERE e.user_id=u.id AND e.status='ACTIVE') AS activeProducts,
       (SELECT COUNT(*) FROM support_tickets s WHERE s.user_id=u.id AND s.status NOT IN ('CLOSED','RESOLVED')) AS openTickets
       FROM users u ${where} ORDER BY u.created_at ${query.sort === "oldest" ? "ASC" : "DESC"},u.id DESC
       LIMIT ? OFFSET ?`).bind(...values,query.size,query.offset).all<Record<string, unknown>>(),
  ]);
  return { rows: result.results ?? [], total: Number(count?.total ?? 0), page: query.page, size: query.size };
}

export async function getOwnerCustomer(id: string) {
  assertOwnerRecordId(id);
  const customer = await db().prepare(`SELECT id,name,email,role,locale,created_at AS createdAt,updated_at AS updatedAt
    FROM users WHERE id=? LIMIT 1`).bind(id).first<Record<string, unknown>>();
  if (!customer) return null;
  const [orders, products, tickets, projects] = await Promise.all([
    db().prepare(`SELECT id,status,total_minor AS totalMinor,currency,created_at AS createdAt
      FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 15`).bind(id).all<Record<string, unknown>>(),
    db().prepare(`SELECT e.id,e.status,e.ends_at AS endsAt,p.name AS productName,p.slug
      FROM entitlements e JOIN products p ON p.id=e.product_id WHERE e.user_id=?
      ORDER BY e.starts_at DESC LIMIT 15`).bind(id).all<Record<string, unknown>>(),
    db().prepare(`SELECT id,subject,status,priority,created_at AS createdAt FROM support_tickets
      WHERE user_id=? ORDER BY created_at DESC LIMIT 15`).bind(id).all<Record<string, unknown>>(),
    db().prepare(`SELECT id,title,status,progress,updated_at AS updatedAt FROM projects
      WHERE user_id=? ORDER BY updated_at DESC LIMIT 15`).bind(id).all<Record<string, unknown>>(),
  ]);
  return { customer, orders:orders.results??[], products:products.results??[], tickets:tickets.results??[], projects:projects.results??[] };
}

export async function getOwnerAnalytics() {
  const [overview, statuses, revenue, daily, recent] = await Promise.all([
    getOwnerOverview(),
    db().prepare("SELECT status,COUNT(*) AS total FROM orders GROUP BY status ORDER BY total DESC").all<{status:string;total:number}>(),
    db().prepare("SELECT currency,SUM(total_minor) AS totalMinor,COUNT(*) AS orders FROM orders WHERE status='PAID' GROUP BY currency ORDER BY currency").all<{currency:string;totalMinor:number;orders:number}>(),
    db().prepare(`SELECT substr(created_at,1,10) AS day,COUNT(*) AS total FROM orders
      WHERE created_at >= datetime('now','-13 days') GROUP BY substr(created_at,1,10) ORDER BY day ASC`).all<{day:string;total:number}>(),
    db().prepare(`SELECT o.id,o.status,o.total_minor AS totalMinor,o.currency,o.created_at AS createdAt,
      u.name AS customerName FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 8`).all<Record<string, unknown>>(),
  ]);
  return { ...overview, orderStatuses:statuses.results??[], paidRevenueByCurrency:revenue.results??[], dailyOrders:daily.results??[], recentOrders:recent.results??[] };
}
