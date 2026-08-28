import {
  getSysOneEnv,
  requireBinding,
} from "@/lib/server/cloudflare";

export const SUPPORT_CATEGORIES = [
  "Technical issue",
  "Account",
  "Download / license",
  "Feedback",
  "Other",
] as const;

export const SUPPORT_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

export const SUPPORT_PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
] as const;

export type SupportCategory =
  (typeof SUPPORT_CATEGORIES)[number];

export type SupportStatus =
  (typeof SUPPORT_STATUSES)[number];

export type SupportPriority =
  (typeof SUPPORT_PRIORITIES)[number];

export type SupportTicketInput = {
  category: SupportCategory;
  subject: string;
  message: string;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  authorUserId: string | null;
  authorType: "USER" | "ADMIN";
  authorName: string | null;
  body: string;
  createdAt: string;
};

export type AdminSupportTicket = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  productId: string | null;
  productName: string | null;
  category: string | null;
  priority: SupportPriority;
  status: SupportStatus;
  subject: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
};

export type SupportTicketValidationResult =
  | {
      ok: true;
      data: SupportTicketInput;
    }
  | {
      ok: false;
      error: string;
      field?: string;
    };

type SupportTicketRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  product_id: string | null;
  product_name: string | null;
  category: string | null;
  priority: string;
  status: string;
  subject: string;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupportMessageRow = {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_type: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

const SUPPORT_TICKET_SELECT = `
  SELECT
    t.id,
    t.user_id,
    u.name AS user_name,
    u.email AS user_email,
    t.product_id,
    p.name AS product_name,
    t.category,
    t.priority,
    t.status,
    t.subject,
    COUNT(m.id) AS message_count,
    MAX(m.created_at) AS last_message_at,
    t.created_at,
    t.updated_at
  FROM support_tickets t
  INNER JOIN users u
    ON u.id = t.user_id
  LEFT JOIN products p
    ON p.id = t.product_id
  LEFT JOIN support_messages m
    ON m.ticket_id = t.id
`;

function getDatabase() {
  return requireBinding(
    getSysOneEnv().SYSONE_DB,
    "SYSONE_DB",
  );
}

function isOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): value is T[number] {
  return (
    typeof value === "string" &&
    allowed.includes(value)
  );
}

function cleanRequiredText(
  value: unknown,
  minLength: number,
  maxLength: number,
) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (
    cleaned.length < minLength ||
    cleaned.length > maxLength
  ) {
    return null;
  }

  return cleaned;
}

function mapSupportTicket(
  row: SupportTicketRow,
): AdminSupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    productId: row.product_id,
    productName: row.product_name,
    category: row.category,
    priority:
      isOneOf(
        row.priority,
        SUPPORT_PRIORITIES,
      )
        ? row.priority
        : "NORMAL",
    status:
      isOneOf(
        row.status,
        SUPPORT_STATUSES,
      )
        ? row.status
        : "OPEN",
    subject: row.subject,
    messageCount:
      Number(row.message_count) || 0,
    lastMessageAt:
      row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupportMessage(
  row: SupportMessageRow,
): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorUserId:
      row.author_user_id,
    authorType:
      row.author_type === "ADMIN"
        ? "ADMIN"
        : "USER",
    authorName:
      row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function validateSupportTicketInput(
  value: unknown,
): SupportTicketValidationResult {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  const input =
    value as Record<string, unknown>;

  const allowedKeys =
    new Set([
      "category",
      "subject",
      "message",
    ]);

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      return {
        ok: false,
        error: "unsupported_support_ticket_field",
      };
    }
  }

  if (
    !isOneOf(
      input.category,
      SUPPORT_CATEGORIES,
    )
  ) {
    return {
      ok: false,
      error: "invalid_support_category",
      field: "category",
    };
  }

  const subject =
    cleanRequiredText(
      input.subject,
      6,
      200,
    );

  if (!subject) {
    return {
      ok: false,
      error: "invalid_support_subject",
      field: "subject",
    };
  }

  const message =
    cleanRequiredText(
      input.message,
      20,
      10000,
    );

  if (!message) {
    return {
      ok: false,
      error: "invalid_support_message",
      field: "message",
    };
  }

  return {
    ok: true,
    data: {
      category:
        input.category,
      subject,
      message,
    },
  };
}

export async function createSupportTicket(
  userId: string,
  input: SupportTicketInput,
) {
  const cleanUserId =
    userId.trim();

  if (!cleanUserId) {
    throw new Error(
      "authentication_required",
    );
  }

  const db = getDatabase();
  const oneHourAgo =
    new Date(
      Date.now() -
        60 * 60 * 1000,
    ).toISOString();

  const recent =
    await db
      .prepare(`
        SELECT COUNT(*) AS total
        FROM support_tickets
        WHERE user_id = ?
          AND datetime(created_at) >= datetime(?)
      `)
      .bind(
        cleanUserId,
        oneHourAgo,
      )
      .first<{
        total: number;
      }>();

  if (
    Number(recent?.total ?? 0) >= 5
  ) {
    throw new Error(
      "too_many_support_tickets",
    );
  }

  const ticketId =
    crypto.randomUUID();
  const messageId =
    crypto.randomUUID();
  const now =
    new Date().toISOString();

  await db.batch([
    db
      .prepare(`
        INSERT INTO support_tickets (
          id,
          user_id,
          product_id,
          category,
          priority,
          status,
          subject,
          created_at,
          updated_at
        )
        VALUES (?, ?, NULL, ?, 'NORMAL', 'OPEN', ?, ?, ?)
      `)
      .bind(
        ticketId,
        cleanUserId,
        input.category,
        input.subject,
        now,
        now,
      ),
    db
      .prepare(`
        INSERT INTO support_messages (
          id,
          ticket_id,
          author_user_id,
          author_type,
          body,
          created_at
        )
        VALUES (?, ?, ?, 'USER', ?, ?)
      `)
      .bind(
        messageId,
        ticketId,
        cleanUserId,
        input.message,
        now,
      ),
  ]);

  return {
    id: ticketId,
    status:
      "OPEN" as const,
    createdAt: now,
  };
}

export async function listAdminSupportTickets(
  options: {
    status?: "ALL" | SupportStatus;
    query?: string;
    limit?: number;
  } = {},
) {
  const status =
    options.status ?? "ALL";
  const query =
    options.query?.trim().slice(
      0,
      200,
    ) ?? "";
  const limit = Math.min(
    Math.max(
      options.limit ?? 100,
      1,
    ),
    250,
  );

  if (
    status !== "ALL" &&
    !isOneOf(
      status,
      SUPPORT_STATUSES,
    )
  ) {
    throw new Error(
      "invalid_support_status",
    );
  }

  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (status !== "ALL") {
    conditions.push(
      "t.status = ?",
    );
    bindings.push(status);
  }

  if (query) {
    const like = `%${query}%`;
    conditions.push(`
      (
        t.id LIKE ?
        OR t.subject LIKE ?
        OR u.name LIKE ?
        OR COALESCE(u.email, '') LIKE ?
        OR COALESCE(t.category, '') LIKE ?
      )
    `);
    bindings.push(
      like,
      like,
      like,
      like,
      like,
    );
  }

  const where =
    conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const sql = `
    ${SUPPORT_TICKET_SELECT}
    ${where}
    GROUP BY
      t.id,
      t.user_id,
      u.name,
      u.email,
      t.product_id,
      p.name,
      t.category,
      t.priority,
      t.status,
      t.subject,
      t.created_at,
      t.updated_at
    ORDER BY
      CASE t.status
        WHEN 'OPEN' THEN 0
        WHEN 'IN_PROGRESS' THEN 1
        WHEN 'RESOLVED' THEN 2
        WHEN 'CLOSED' THEN 3
        ELSE 4
      END,
      t.updated_at DESC
    LIMIT ?
  `;

  bindings.push(limit);

  const result =
    await getDatabase()
      .prepare(sql)
      .bind(...bindings)
      .all<SupportTicketRow>();

  return (
    result.results ?? []
  ).map(mapSupportTicket);
}

export async function getAdminSupportTicketById(
  id: string,
): Promise<AdminSupportTicket | null> {
  const cleanId = id.trim();

  if (!cleanId) {
    return null;
  }

  const db = getDatabase();

  const row =
    await db
      .prepare(`
        ${SUPPORT_TICKET_SELECT}
        WHERE t.id = ?
        GROUP BY
          t.id,
          t.user_id,
          u.name,
          u.email,
          t.product_id,
          p.name,
          t.category,
          t.priority,
          t.status,
          t.subject,
          t.created_at,
          t.updated_at
        LIMIT 1
      `)
      .bind(cleanId)
      .first<SupportTicketRow>();

  if (!row) {
    return null;
  }

  const messageResult =
    await db
      .prepare(`
        SELECT
          m.id,
          m.ticket_id,
          m.author_user_id,
          m.author_type,
          u.name AS author_name,
          m.body,
          m.created_at
        FROM support_messages m
        LEFT JOIN users u
          ON u.id = m.author_user_id
        WHERE m.ticket_id = ?
        ORDER BY m.created_at ASC, m.id ASC
      `)
      .bind(cleanId)
      .all<SupportMessageRow>();

  return {
    ...mapSupportTicket(row),
    messages:
      (
        messageResult.results ?? []
      ).map(mapSupportMessage),
  };
}

export async function getUserSupportTicketById(
  id: string,
  userId: string,
) {
  const cleanUserId =
    userId.trim();

  if (!cleanUserId) {
    return null;
  }

  const ticket =
    await getAdminSupportTicketById(
      id,
    );

  if (
    !ticket ||
    ticket.userId !== cleanUserId
  ) {
    return null;
  }

  return ticket;
}

export async function updateAdminSupportTicket(
  id: string,
  input: {
    status?: SupportStatus;
    priority?: SupportPriority;
  },
) {
  const cleanId = id.trim();

  if (!cleanId) {
    throw new Error(
      "invalid_support_ticket_id",
    );
  }

  if (
    input.status === undefined &&
    input.priority === undefined
  ) {
    throw new Error(
      "empty_support_ticket_update",
    );
  }

  if (
    input.status !== undefined &&
    !isOneOf(
      input.status,
      SUPPORT_STATUSES,
    )
  ) {
    throw new Error(
      "invalid_support_status",
    );
  }

  if (
    input.priority !== undefined &&
    !isOneOf(
      input.priority,
      SUPPORT_PRIORITIES,
    )
  ) {
    throw new Error(
      "invalid_support_priority",
    );
  }

  const existing =
    await getAdminSupportTicketById(
      cleanId,
    );

  if (!existing) {
    return null;
  }

  const now =
    new Date().toISOString();

  await getDatabase()
    .prepare(`
      UPDATE support_tickets
      SET
        status = ?,
        priority = ?,
        updated_at = ?
      WHERE id = ?
    `)
    .bind(
      input.status ??
        existing.status,
      input.priority ??
        existing.priority,
      now,
      cleanId,
    )
    .run();

  return getAdminSupportTicketById(
    cleanId,
  );
}

export async function addAdminSupportMessage(
  id: string,
  body: unknown,
) {
  const cleanId = id.trim();
  const cleanBody =
    cleanRequiredText(
      body,
      1,
      10000,
    );

  if (!cleanId) {
    throw new Error(
      "invalid_support_ticket_id",
    );
  }

  if (!cleanBody) {
    throw new Error(
      "invalid_support_message",
    );
  }

  const existing =
    await getAdminSupportTicketById(
      cleanId,
    );

  if (!existing) {
    return null;
  }

  const messageId =
    crypto.randomUUID();
  const now =
    new Date().toISOString();
  const db = getDatabase();

  await db.batch([
    db
      .prepare(`
        INSERT INTO support_messages (
          id,
          ticket_id,
          author_user_id,
          author_type,
          body,
          created_at
        )
        VALUES (?, ?, NULL, 'ADMIN', ?, ?)
      `)
      .bind(
        messageId,
        cleanId,
        cleanBody,
        now,
      ),
    db
      .prepare(`
        UPDATE support_tickets
        SET
          status = CASE
            WHEN status = 'OPEN'
              THEN 'IN_PROGRESS'
            ELSE status
          END,
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        now,
        cleanId,
      ),
  ]);

  return getAdminSupportTicketById(
    cleanId,
  );
}

export async function getAdminSupportTicketStats() {
  const result =
    await getDatabase()
      .prepare(`
        SELECT
          status,
          COUNT(*) AS total
        FROM support_tickets
        GROUP BY status
      `)
      .all<{
        status: string;
        total: number;
      }>();

  const stats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  };

  for (
    const row of
    result.results ?? []
  ) {
    const count =
      Number(row.total) || 0;

    stats.total += count;

    switch (row.status) {
      case "OPEN":
        stats.open = count;
        break;
      case "IN_PROGRESS":
        stats.inProgress = count;
        break;
      case "RESOLVED":
        stats.resolved = count;
        break;
      case "CLOSED":
        stats.closed = count;
        break;
    }
  }

  return stats;
}
