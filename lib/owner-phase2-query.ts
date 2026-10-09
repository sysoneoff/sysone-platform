/** Validated query inputs shared by the V4.4 owner read endpoints. */
export type OwnerCollection = "orders" | "customers";
export type OwnerQuery = { page: number; size: number; q: string; status: string; sort: "newest" | "oldest"; offset: number };
export const ORDER_STATUSES = ["PENDING", "PAID", "CANCELLED", "FAILED", "REFUNDED"] as const;

export function parseOwnerQuery(params: URLSearchParams, collection: OwnerCollection): OwnerQuery {
  const rawPage = params.get("page") ?? "1";
  const rawSize = params.get("size") ?? "20";
  if (!/^[1-9]\d{0,4}$/.test(rawPage) || !/^[1-9]\d{0,2}$/.test(rawSize)) throw new Error("invalid_pagination");
  const page = Number(rawPage);
  const size = Number(rawSize);
  if (size > 50 || page > 10000) throw new Error("invalid_pagination");
  const q = (params.get("q") ?? "").trim();
  if (q.length > 100 || /[\x00-\x1f\x7f]/.test(q)) throw new Error("invalid_search");
  const status = (params.get("status") ?? "").trim().toUpperCase();
  if (status && (collection !== "orders" || !ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number]))) throw new Error("invalid_status");
  const sort = params.get("sort") ?? "newest";
  if (sort !== "newest" && sort !== "oldest") throw new Error("invalid_sort");
  return { page, size, q, status, sort, offset: (page - 1) * size };
}

export function assertOwnerRecordId(value: unknown): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 128 || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error("invalid_id");
  }
  return value;
}

/** Prefix spreadsheet operators so an exported value cannot become an executable formula. */
export function safeCsvCell(value: unknown): string {
  let text = String(value ?? "").replace(/\r\n?/g, "\n");
  if (/^\s*[=+@\-\t]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return "\uFEFF" + [headers.map(safeCsvCell).join(","), ...rows.map(row => row.map(safeCsvCell).join(","))].join("\r\n");
}
