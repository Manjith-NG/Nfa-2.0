-- =============================================================================
-- NAAC criteria + metrics (run after schema.sql)
-- Add new rows here or in Supabase Table Editor — app fetches via API
-- =============================================================================

CREATE TYPE "InputProcessOutcome" AS ENUM ('INPUT', 'PROCESS', 'OUTCOME');

CREATE TABLE naac_criteria (
  id                    TEXT PRIMARY KEY,
  number                INTEGER NOT NULL UNIQUE,
  title                 TEXT NOT NULL,
  "inputProcessOutcome" "InputProcessOutcome" NOT NULL,
  "sortOrder"           INTEGER NOT NULL DEFAULT 0,
  "isActive"            BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE metrics (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  description   TEXT,
  "criterionId" TEXT NOT NULL REFERENCES naac_criteria (id) ON DELETE CASCADE,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX metrics_criterionId_idx ON metrics ("criterionId");

-- Example: add a new metric from Supabase (shows in Raise Request automatically)
-- INSERT INTO naac_criteria (id, number, title, "inputProcessOutcome", "sortOrder")
-- VALUES ('nc_custom', 11, 'New Criterion', 'PROCESS', 11);
--
-- INSERT INTO metrics (id, code, title, description, "criterionId", "sortOrder")
-- VALUES (
--   'm_custom',
--   '11.1',
--   'Custom Metric',
--   'Description for the new metric.',
--   'nc_custom',
--   0
-- );
