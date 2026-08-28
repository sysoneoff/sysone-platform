PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS project_requests (
  id TEXT PRIMARY KEY,

  user_id TEXT,
  project_id TEXT UNIQUE,

  project_type TEXT NOT NULL,
  platforms_json TEXT NOT NULL DEFAULT '[]',

  description TEXT NOT NULL,

  target_timing TEXT,
  budget_stage TEXT,

  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_telegram TEXT,
  organization_name TEXT,

  status TEXT NOT NULL DEFAULT 'SUBMITTED'
    CHECK (
      status IN (
        'SUBMITTED',
        'REVIEWING',
        'ACCEPTED',
        'REJECTED',
        'CONVERTED',
        'CLOSED'
      )
    ),

  internal_note TEXT,

  source TEXT NOT NULL DEFAULT 'WEB',

  reviewed_at TEXT,
  converted_at TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  FOREIGN KEY(project_id)
    REFERENCES projects(id)
    ON DELETE SET NULL,

  CHECK (
    length(trim(project_type)) > 0
  ),

  CHECK (
    length(trim(description)) > 0
  ),

  CHECK (
    length(trim(contact_name)) > 0
  ),

  CHECK (
    (
      contact_email IS NOT NULL
      AND length(trim(contact_email)) > 0
    )
    OR
    (
      contact_telegram IS NOT NULL
      AND length(trim(contact_telegram)) > 0
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_project_requests_user
  ON project_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_project_requests_status
  ON project_requests(status);

CREATE INDEX IF NOT EXISTS idx_project_requests_created
  ON project_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_requests_project
  ON project_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_project_requests_email
  ON project_requests(contact_email);