import {
  getSysOneEnv,
  requireBinding,
} from "@/lib/server/cloudflare";

const PROJECT_TYPES = [
  "Web platform",
  "Mobile app",
  "Desktop software",
  "AI system",
  "Game",
  "Business automation",
] as const;

const PLATFORMS = [
  "Web",
  "Android",
  "iOS",
  "Windows",
  "Cloud",
  "Not sure yet",
] as const;

const TARGET_TIMINGS = [
  "Flexible",
  "1–2 months",
  "3–6 months",
  "Long-term product",
] as const;

const BUDGET_STAGES = [
  "Need estimate",
  "Defined budget",
  "Exploring options",
] as const;

export type ProjectType =
  (typeof PROJECT_TYPES)[number];

export type ProjectPlatform =
  (typeof PLATFORMS)[number];

export type ProjectTargetTiming =
  (typeof TARGET_TIMINGS)[number];

export type ProjectBudgetStage =
  (typeof BUDGET_STAGES)[number];

export type ProjectRequestInput = {
  projectType: ProjectType;
  platforms: ProjectPlatform[];
  description: string;
  targetTiming: ProjectTargetTiming | null;
  budgetStage: ProjectBudgetStage | null;
  contactName: string;
  contactEmail: string | null;
  contactTelegram: string | null;
  organizationName: string | null;
};

export type ProjectRequestRecord = {
  id: string;
  userId: string | null;
  projectId: string | null;
  projectType: ProjectType;
  platforms: ProjectPlatform[];
  description: string;
  targetTiming: ProjectTargetTiming | null;
  budgetStage: ProjectBudgetStage | null;
  contactName: string;
  contactEmail: string | null;
  contactTelegram: string | null;
  organizationName: string | null;
  status: "SUBMITTED";
  source: "WEB";
  createdAt: string;
  updatedAt: string;
};

export type ProjectRequestValidationResult =
  | {
      ok: true;
      data: ProjectRequestInput;
    }
  | {
      ok: false;
      error: string;
      field?: string;
    };

function getDatabase() {
  return requireBinding(
    getSysOneEnv().SYSONE_DB,
    "SYSONE_DB",
  );
}

function cleanRequiredText(
  value: unknown,
  maxLength: number,
) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (
    cleaned.length === 0 ||
    cleaned.length > maxLength
  ) {
    return null;
  }

  return cleaned;
}

function cleanOptionalText(
  value: unknown,
  maxLength: number,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length > maxLength) {
    return null;
  }

  return cleaned;
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

function isValidEmail(value: string) {
  if (
    value.length > 254 ||
    value.includes(" ")
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function normalizeTelegram(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withoutUrl = trimmed
    .replace(
      /^https?:\/\/(?:www\.)?t\.me\//i,
      "",
    )
    .replace(/^@/, "");

  if (
    !/^[A-Za-z0-9_]{5,32}$/.test(
      withoutUrl,
    )
  ) {
    return null;
  }

  return `@${withoutUrl}`;
}

function parsePlatforms(
  value: unknown,
):
  | ProjectPlatform[]
  | null {
  if (!Array.isArray(value)) {
    return null;
  }

  if (
    value.length === 0 ||
    value.length > PLATFORMS.length
  ) {
    return null;
  }

  const result: ProjectPlatform[] = [];

  for (const item of value) {
    if (!isOneOf(item, PLATFORMS)) {
      return null;
    }

    if (!result.includes(item)) {
      result.push(item);
    }
  }

  return result;
}

export function validateProjectRequestInput(
  value: unknown,
): ProjectRequestValidationResult {
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

  if (
    !isOneOf(
      input.projectType,
      PROJECT_TYPES,
    )
  ) {
    return {
      ok: false,
      error: "invalid_project_type",
      field: "projectType",
    };
  }

  const platforms = parsePlatforms(
    input.platforms,
  );

  if (!platforms) {
    return {
      ok: false,
      error: "invalid_platforms",
      field: "platforms",
    };
  }

  const description =
    cleanRequiredText(
      input.description,
      10000,
    );

  if (!description) {
    return {
      ok: false,
      error: "invalid_description",
      field: "description",
    };
  }

  let targetTiming:
    | ProjectTargetTiming
    | null = null;

  if (
    input.targetTiming !== undefined &&
    input.targetTiming !== null &&
    input.targetTiming !== ""
  ) {
    if (
      !isOneOf(
        input.targetTiming,
        TARGET_TIMINGS,
      )
    ) {
      return {
        ok: false,
        error: "invalid_target_timing",
        field: "targetTiming",
      };
    }

    targetTiming =
      input.targetTiming;
  }

  let budgetStage:
    | ProjectBudgetStage
    | null = null;

  if (
    input.budgetStage !== undefined &&
    input.budgetStage !== null &&
    input.budgetStage !== ""
  ) {
    if (
      !isOneOf(
        input.budgetStage,
        BUDGET_STAGES,
      )
    ) {
      return {
        ok: false,
        error: "invalid_budget_stage",
        field: "budgetStage",
      };
    }

    budgetStage =
      input.budgetStage;
  }

  const contactName =
    cleanRequiredText(
      input.contactName,
      120,
    );

  if (!contactName) {
    return {
      ok: false,
      error: "invalid_contact_name",
      field: "contactName",
    };
  }

  const emailInput =
    cleanOptionalText(
      input.contactEmail,
      254,
    );

  if (
    emailInput &&
    !isValidEmail(emailInput)
  ) {
    return {
      ok: false,
      error: "invalid_contact_email",
      field: "contactEmail",
    };
  }

  const telegramInput =
    cleanOptionalText(
      input.contactTelegram,
      100,
    );

  let contactTelegram:
    | string
    | null = null;

  if (telegramInput) {
    contactTelegram =
      normalizeTelegram(
        telegramInput,
      );

    if (!contactTelegram) {
      return {
        ok: false,
        error:
          "invalid_contact_telegram",
        field: "contactTelegram",
      };
    }
  }

  if (
    !emailInput &&
    !contactTelegram
  ) {
    return {
      ok: false,
      error:
        "contact_method_required",
      field: "contactEmail",
    };
  }

  const organizationName =
    cleanOptionalText(
      input.organizationName,
      200,
    );

  return {
    ok: true,
    data: {
      projectType:
        input.projectType,
      platforms,
      description,
      targetTiming,
      budgetStage,
      contactName,
      contactEmail:
        emailInput
          ? emailInput.toLowerCase()
          : null,
      contactTelegram,
      organizationName,
    },
  };
}

export async function createProjectRequest(
  input: ProjectRequestInput,
  options?: {
    userId?: string | null;
  },
): Promise<ProjectRequestRecord> {
  const db = getDatabase();

  const id = crypto.randomUUID();
  const now =
    new Date().toISOString();

  const userId =
    options?.userId ?? null;

  await db
    .prepare(
      `
        INSERT INTO project_requests (
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
          source,
          created_at,
          updated_at
        )
        VALUES (
          ?,
          ?,
          NULL,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'SUBMITTED',
          'WEB',
          ?,
          ?
        )
      `,
    )
    .bind(
      id,
      userId,
      input.projectType,
      JSON.stringify(
        input.platforms,
      ),
      input.description,
      input.targetTiming,
      input.budgetStage,
      input.contactName,
      input.contactEmail,
      input.contactTelegram,
      input.organizationName,
      now,
      now,
    )
    .run();

  return {
    id,
    userId,
    projectId: null,
    projectType:
      input.projectType,
    platforms:
      input.platforms,
    description:
      input.description,
    targetTiming:
      input.targetTiming,
    budgetStage:
      input.budgetStage,
    contactName:
      input.contactName,
    contactEmail:
      input.contactEmail,
    contactTelegram:
      input.contactTelegram,
    organizationName:
      input.organizationName,
    status: "SUBMITTED",
    source: "WEB",
    createdAt: now,
    updatedAt: now,
  };
}