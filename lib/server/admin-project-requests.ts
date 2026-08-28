import {
  getSysOneEnv,
  requireBinding,
} from "@/lib/server/cloudflare";

export const ADMIN_PROJECT_REQUEST_STATUSES = [
  "SUBMITTED",
  "REVIEWING",
  "ACCEPTED",
  "REJECTED",
  "CONVERTED",
  "CLOSED",
] as const;

export type AdminProjectRequestStatus =
  (typeof ADMIN_PROJECT_REQUEST_STATUSES)[number];

export type AdminProjectRequest = {
  id: string;

  userId: string | null;
  projectId: string | null;

  projectType: string;
  platforms: string[];

  description: string;

  targetTiming: string | null;
  budgetStage: string | null;

  contactName: string;
  contactEmail: string | null;
  contactTelegram: string | null;
  organizationName: string | null;

  status: AdminProjectRequestStatus;

  internalNote: string | null;

  source: string;

  reviewedAt: string | null;
  convertedAt: string | null;

  createdAt: string;
  updatedAt: string;
};

export type AdminProjectRequestListOptions = {
  status?: AdminProjectRequestStatus | "ALL";
  query?: string;
  limit?: number;
};

export type UpdateAdminProjectRequestInput = {
  status?: AdminProjectRequestStatus;
  internalNote?: string | null;
};

export type ConvertProjectRequestInput = {
  title?: string | null;
};

type ProjectRequestRow = {
  id: string;

  user_id: string | null;
  project_id: string | null;

  project_type: string;
  platforms_json: string;

  description: string;

  target_timing: string | null;
  budget_stage: string | null;

  contact_name: string;
  contact_email: string | null;
  contact_telegram: string | null;
  organization_name: string | null;

  status: string;

  internal_note: string | null;

  source: string;

  reviewed_at: string | null;
  converted_at: string | null;

  created_at: string;
  updated_at: string;
};

function getDatabase() {
  return requireBinding(
    getSysOneEnv().SYSONE_DB,
    "SYSONE_DB",
  );
}

function isProjectRequestStatus(
  value: unknown,
): value is AdminProjectRequestStatus {
  return (
    typeof value === "string" &&
    ADMIN_PROJECT_REQUEST_STATUSES.includes(
      value as AdminProjectRequestStatus,
    )
  );
}

function parsePlatforms(
  value: string,
): string[] {
  try {
    const parsed = JSON.parse(
      value,
    );

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (
        item,
      ): item is string =>
        typeof item ===
          "string" &&
        item.trim().length >
          0,
    );
  } catch {
    return [];
  }
}

function mapProjectRequest(
  row: ProjectRequestRow,
): AdminProjectRequest {
  if (
    !isProjectRequestStatus(
      row.status,
    )
  ) {
    throw new Error(
      "invalid_project_request_status_in_database",
    );
  }

  return {
    id: row.id,

    userId: row.user_id,
    projectId: row.project_id,

    projectType:
      row.project_type,

    platforms:
      parsePlatforms(
        row.platforms_json,
      ),

    description:
      row.description,

    targetTiming:
      row.target_timing,

    budgetStage:
      row.budget_stage,

    contactName:
      row.contact_name,

    contactEmail:
      row.contact_email,

    contactTelegram:
      row.contact_telegram,

    organizationName:
      row.organization_name,

    status:
      row.status,

    internalNote:
      row.internal_note,

    source:
      row.source,

    reviewedAt:
      row.reviewed_at,

    convertedAt:
      row.converted_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function cleanQuery(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(0, 200);
}

function escapeLike(
  value: string,
) {
  return value
    .replace(
      /\\/g,
      "\\\\",
    )
    .replace(
      /%/g,
      "\\%",
    )
    .replace(
      /_/g,
      "\\_",
    );
}

function normalizeLimit(
  value: unknown,
) {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    )
  ) {
    return 100;
  }

  return Math.min(
    250,
    Math.max(
      1,
      Math.floor(value),
    ),
  );
}

function cleanOptionalNote(
  value: unknown,
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    value === null
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      "invalid_internal_note",
    );
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return null;
  }

  if (
    cleaned.length >
    10000
  ) {
    throw new Error(
      "invalid_internal_note",
    );
  }

  return cleaned;
}

function cleanProjectTitle(
  value: unknown,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      "invalid_project_title",
    );
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return null;
  }

  if (
    cleaned.length >
    200
  ) {
    throw new Error(
      "invalid_project_title",
    );
  }

  return cleaned;
}

const PROJECT_REQUEST_SELECT = `
  SELECT
    id,
    user_id,
    project_id,
    project_type,
    platforms_json,
    description,
    target_timing,
    budget_stage,
    contact_name,
    contact_email,
    contact_telegram,
    organization_name,
    status,
    internal_note,
    source,
    reviewed_at,
    converted_at,
    created_at,
    updated_at
  FROM project_requests
`;

export async function listAdminProjectRequests(
  options: AdminProjectRequestListOptions = {},
): Promise<AdminProjectRequest[]> {
  const db =
    getDatabase();

  const status =
    options.status ??
    "ALL";

  if (
    status !== "ALL" &&
    !isProjectRequestStatus(
      status,
    )
  ) {
    throw new Error(
      "invalid_project_request_status",
    );
  }

  const query =
    cleanQuery(
      options.query,
    );

  const limit =
    normalizeLimit(
      options.limit,
    );

  const conditions: string[] =
    [];

  const bindings: unknown[] =
    [];

  if (
    status !== "ALL"
  ) {
    conditions.push(
      "status = ?",
    );

    bindings.push(
      status,
    );
  }

  if (query) {
    const pattern =
      `%${escapeLike(
        query,
      )}%`;

    conditions.push(`
      (
        project_type LIKE ? ESCAPE '\\'
        OR description LIKE ? ESCAPE '\\'
        OR contact_name LIKE ? ESCAPE '\\'
        OR COALESCE(contact_email, '') LIKE ? ESCAPE '\\'
        OR COALESCE(contact_telegram, '') LIKE ? ESCAPE '\\'
        OR COALESCE(organization_name, '') LIKE ? ESCAPE '\\'
        OR id LIKE ? ESCAPE '\\'
      )
    `);

    bindings.push(
      pattern,
      pattern,
      pattern,
      pattern,
      pattern,
      pattern,
      pattern,
    );
  }

  let sql =
    PROJECT_REQUEST_SELECT;

  if (
    conditions.length
  ) {
    sql += `
      WHERE ${conditions.join(
        " AND ",
      )}
    `;
  }

  sql += `
    ORDER BY
      CASE status
        WHEN 'SUBMITTED' THEN 0
        WHEN 'REVIEWING' THEN 1
        WHEN 'ACCEPTED' THEN 2
        WHEN 'REJECTED' THEN 3
        WHEN 'CONVERTED' THEN 4
        WHEN 'CLOSED' THEN 5
        ELSE 6
      END,
      created_at DESC
    LIMIT ?
  `;

  bindings.push(
    limit,
  );

  const result =
    await db
      .prepare(sql)
      .bind(
        ...bindings,
      )
      .all<ProjectRequestRow>();

  return (
    result.results ?? []
  ).map(
    mapProjectRequest,
  );
}

export async function getAdminProjectRequestById(
  id: string,
): Promise<AdminProjectRequest | null> {
  const cleanId =
    id.trim();

  if (!cleanId) {
    return null;
  }

  const db =
    getDatabase();

  const row =
    await db
      .prepare(`
        ${PROJECT_REQUEST_SELECT}
        WHERE id = ?
        LIMIT 1
      `)
      .bind(cleanId)
      .first<ProjectRequestRow>();

  return row
    ? mapProjectRequest(
        row,
      )
    : null;
}

export async function updateAdminProjectRequest(
  id: string,
  input: UpdateAdminProjectRequestInput,
): Promise<AdminProjectRequest | null> {
  const cleanId =
    id.trim();

  if (!cleanId) {
    throw new Error(
      "invalid_project_request_id",
    );
  }

  if (
    !input ||
    typeof input !==
      "object"
  ) {
    throw new Error(
      "invalid_project_request_update",
    );
  }

  const existing =
    await getAdminProjectRequestById(
      cleanId,
    );

  if (!existing) {
    return null;
  }

  if (
    existing.status ===
    "CONVERTED"
  ) {
    throw new Error(
      "converted_project_request_is_locked",
    );
  }

  let nextStatus =
    existing.status;

  if (
    input.status !==
    undefined
  ) {
    if (
      !isProjectRequestStatus(
        input.status,
      )
    ) {
      throw new Error(
        "invalid_project_request_status",
      );
    }

    if (
      input.status ===
      "CONVERTED"
    ) {
      throw new Error(
        "use_project_request_conversion",
      );
    }

    nextStatus =
      input.status;
  }

  const nextNote =
    cleanOptionalNote(
      input.internalNote,
    );

  const now =
    new Date().toISOString();

  const reviewedAt =
    nextStatus !==
      "SUBMITTED"
      ? existing.reviewedAt ??
        now
      : null;

  const db =
    getDatabase();

  await db
    .prepare(`
      UPDATE project_requests
      SET
        status = ?,
        internal_note = ?,
        reviewed_at = ?,
        updated_at = ?
      WHERE id = ?
        AND status != 'CONVERTED'
    `)
    .bind(
      nextStatus,

      nextNote ===
      undefined
        ? existing.internalNote
        : nextNote,

      reviewedAt,

      now,

      cleanId,
    )
    .run();

  return getAdminProjectRequestById(
    cleanId,
  );
}

export async function convertAdminProjectRequestToProject(
  id: string,
  input: ConvertProjectRequestInput = {},
): Promise<{
  request: AdminProjectRequest;
  projectId: string;
}> {
  const cleanId =
    id.trim();

  if (!cleanId) {
    throw new Error(
      "invalid_project_request_id",
    );
  }

  const request =
    await getAdminProjectRequestById(
      cleanId,
    );

  if (!request) {
    throw new Error(
      "project_request_not_found",
    );
  }

  if (
    request.projectId ||
    request.status ===
      "CONVERTED"
  ) {
    throw new Error(
      "project_request_already_converted",
    );
  }

  if (
    request.status !==
    "ACCEPTED"
  ) {
    throw new Error(
      "project_request_must_be_accepted",
    );
  }

  const providedTitle =
    cleanProjectTitle(
      input.title,
    );

  const title =
    providedTitle ??
    `${request.projectType} — ${request.contactName}`;

  const projectId =
    crypto.randomUUID();

  const now =
    new Date().toISOString();

  const db =
    getDatabase();

  await db.batch([
    db
      .prepare(`
        INSERT INTO projects (
          id,
          user_id,
          organization_id,
          title,
          project_type,
          description,
          status,
          progress,
          created_at,
          updated_at
        )
        SELECT
          ?,
          user_id,
          NULL,
          ?,
          project_type,
          description,
          'LEAD',
          0,
          ?,
          ?
        FROM project_requests
        WHERE id = ?
          AND status = 'ACCEPTED'
          AND project_id IS NULL
      `)
      .bind(
        projectId,
        title,
        now,
        now,
        cleanId,
      ),

    db
      .prepare(`
        UPDATE project_requests
        SET
          project_id = ?,
          status = 'CONVERTED',
          reviewed_at = COALESCE(
            reviewed_at,
            ?
          ),
          converted_at = ?,
          updated_at = ?
        WHERE id = ?
          AND status = 'ACCEPTED'
          AND project_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM projects
            WHERE projects.id = ?
          )
      `)
      .bind(
        projectId,
        now,
        now,
        now,
        cleanId,
        projectId,
      ),
  ]);

  const converted =
    await getAdminProjectRequestById(
      cleanId,
    );

  if (
    !converted ||
    converted.projectId !==
      projectId ||
    converted.status !==
      "CONVERTED"
  ) {
    throw new Error(
      "project_request_conversion_conflict",
    );
  }

  return {
    request:
      converted,

    projectId,
  };
}

export async function getAdminProjectRequestStats() {
  const db =
    getDatabase();

  type StatusCountRow = {
    status: string;
    total: number;
  };

  const result =
    await db
      .prepare(`
        SELECT
          status,
          COUNT(*) AS total
        FROM project_requests
        GROUP BY status
      `)
      .all<StatusCountRow>();

  const stats = {
    total: 0,
    submitted: 0,
    reviewing: 0,
    accepted: 0,
    rejected: 0,
    converted: 0,
    closed: 0,
  };

  for (
    const row of
    result.results ?? []
  ) {
    const count =
      Number(
        row.total,
      ) || 0;

    stats.total +=
      count;

    switch (
      row.status
    ) {
      case "SUBMITTED":
        stats.submitted =
          count;
        break;

      case "REVIEWING":
        stats.reviewing =
          count;
        break;

      case "ACCEPTED":
        stats.accepted =
          count;
        break;

      case "REJECTED":
        stats.rejected =
          count;
        break;

      case "CONVERTED":
        stats.converted =
          count;
        break;

      case "CLOSED":
        stats.closed =
          count;
        break;
    }
  }

  return stats;
}