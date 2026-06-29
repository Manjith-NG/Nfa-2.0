-- =============================================================================
-- NFA 2.0 — Note For Approval System
-- Supabase / PostgreSQL schema (matches prisma/schema.prisma)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- Extensions (optional; Prisma generates CUIDs in the app)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE "RoleCode" AS ENUM (
  'FACULTY',
  'HOD',
  'CLUB_AUTHORITY',
  'IQAC',
  'PMSEB',
  'HR',
  'COE',
  'REGISTRAR',
  'OFC',
  'ADMIN'
);

CREATE TYPE "RequestCategory" AS ENUM ('ACADEMIC', 'CLUB');

CREATE TYPE "AcademicSection" AS ENUM ('PHD', 'RO', 'EXO', 'GEN', 'DEPT', 'HR', 'COE');

CREATE TYPE "RequestStatus" AS ENUM (
  'DRAFT',
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'RESEND',
  'FORWARDED',
  'COMPLETED'
);

CREATE TYPE "ApprovalAction" AS ENUM (
  'SUBMIT',
  'APPROVE',
  'REJECT',
  'RESEND',
  'FORWARD',
  'COMMENT',
  'REASSIGN'
);

CREATE TYPE "AuthorityAssignmentType" AS ENUM ('TEMPORARY', 'PERMANENT');

CREATE TYPE "NotificationType" AS ENUM (
  'REQUEST_SUBMITTED',
  'APPROVAL_PENDING',
  'APPROVED',
  'REJECTED',
  'RESEND',
  'REQUEST_COMPLETED',
  'AUTHORITY_CHANGED',
  'COMMENT_ADDED'
);

-- ─── MASTER DATA ─────────────────────────────────────────────────────────────

CREATE TABLE roles (
  id            TEXT PRIMARY KEY,
  code          "RoleCode" NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  permissions   JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  "hodId"       TEXT UNIQUE,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX departments_code_idx ON departments (code);

CREATE TABLE status_master (
  id            TEXT PRIMARY KEY,
  code          "RequestStatus" NOT NULL UNIQUE,
  label         TEXT NOT NULL,
  color         TEXT NOT NULL,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE request_types (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  category      "RequestCategory" NOT NULL,
  description   TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clubs (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE designations (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_positions (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  "employeeId"    TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  "passwordHash"  TEXT NOT NULL,
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  phone           TEXT,
  "roleId"        TEXT NOT NULL REFERENCES roles (id),
  "departmentId"  TEXT REFERENCES departments (id),
  "designationId" TEXT REFERENCES designations (id),
  "positionId"    TEXT REFERENCES employee_positions (id),
  "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
  "lastLoginAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX users_roleId_idx ON users ("roleId");
CREATE INDEX users_departmentId_idx ON users ("departmentId");
CREATE INDEX users_designationId_idx ON users ("designationId");
CREATE INDEX users_positionId_idx ON users ("positionId");
CREATE INDEX users_email_idx ON users (email);

ALTER TABLE departments
  ADD CONSTRAINT departments_hodId_fkey
  FOREIGN KEY ("hodId") REFERENCES users (id) ON DELETE SET NULL;

-- ─── CLUB AUTHORITIES ────────────────────────────────────────────────────────

CREATE TABLE club_authorities (
  id            TEXT PRIMARY KEY,
  "clubId"      TEXT NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES users (id),
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "assignedBy"  TEXT,
  "assignedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt"   TIMESTAMPTZ,
  UNIQUE ("clubId", "userId")
);

CREATE INDEX club_authorities_userId_idx ON club_authorities ("userId");

-- ─── AUTHORITY MAPPING (IQAC, PMSEB, HR, COE, HOD per dept) ─────────────────

CREATE TABLE authority_mapping (
  id                TEXT PRIMARY KEY,
  "roleCode"        "RoleCode" NOT NULL,
  "userId"          TEXT NOT NULL REFERENCES users (id),
  "departmentId"    TEXT,
  "assignmentType"  "AuthorityAssignmentType" NOT NULL DEFAULT 'PERMANENT',
  "isActive"        BOOLEAN NOT NULL DEFAULT TRUE,
  "assignedById"    TEXT REFERENCES users (id),
  "startDate"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "endDate"         TIMESTAMPTZ,
  reason            TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX authority_mapping_roleCode_isActive_idx ON authority_mapping ("roleCode", "isActive");
CREATE INDEX authority_mapping_userId_idx ON authority_mapping ("userId");

-- ─── WORKFLOW ────────────────────────────────────────────────────────────────

CREATE TABLE workflow_templates (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  category          "RequestCategory" NOT NULL,
  "requestTypeId"   TEXT REFERENCES request_types (id),
  "academicSection" "AcademicSection",
  "clubId"          TEXT REFERENCES clubs (id),
  steps             JSONB NOT NULL,
  "isDefault"       BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive"        BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workflow_templates_category_idx ON workflow_templates (category);
CREATE INDEX workflow_templates_requestTypeId_idx ON workflow_templates ("requestTypeId");
CREATE INDEX workflow_templates_clubId_idx ON workflow_templates ("clubId");

CREATE TABLE approval_workflow (
  id            TEXT PRIMARY KEY,
  category      "RequestCategory" NOT NULL,
  "stepOrder"   INTEGER NOT NULL,
  "roleCode"    "RoleCode" NOT NULL,
  "stepLabel"   TEXT NOT NULL,
  "isRequired"  BOOLEAN NOT NULL DEFAULT TRUE,
  "skipForClub" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, "stepOrder")
);

CREATE INDEX approval_workflow_category_idx ON approval_workflow (category);

-- ─── REQUESTS ────────────────────────────────────────────────────────────────

CREATE TABLE requests (
  id                      TEXT PRIMARY KEY,
  "requestNumber"         TEXT NOT NULL UNIQUE,
  title                   TEXT NOT NULL,
  description             TEXT,
  category                "RequestCategory" NOT NULL,
  "requestTypeId"         TEXT REFERENCES request_types (id),
  "clubId"                TEXT REFERENCES clubs (id),
  status                  "RequestStatus" NOT NULL DEFAULT 'DRAFT',
  "currentStep"           INTEGER NOT NULL DEFAULT 0,
  "currentRoleCode"       "RoleCode",
  "workflowPath"          JSONB,
  "raisedById"            TEXT NOT NULL REFERENCES users (id),
  "departmentId"          TEXT NOT NULL REFERENCES departments (id),
  "academicSection"       "AcademicSection",
  "briefNote"             TEXT,
  "needForProposal"       TEXT,
  "proposalDate"          TIMESTAMPTZ,
  "eventStartDate"        TIMESTAMPTZ,
  "eventEndDate"          TIMESTAMPTZ,
  links                   TEXT,
  "naacCategory"          TEXT,
  "metricsCategory"       TEXT,
  "budgetAmount"          DOUBLE PRECISION,
  "budgetPurpose"         TEXT,
  "eventDate"             TIMESTAMPTZ,
  venue                   TEXT,
  expenditures            JSONB,
  receivables             JSONB,
  "grandTotalExpenditure" DOUBLE PRECISION,
  "grandTotalReceivable"  DOUBLE PRECISION,
  "budgetDifference"      DOUBLE PRECISION,
  "financialDescription"  TEXT,
  "submittedAt"           TIMESTAMPTZ,
  "completedAt"           TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX requests_raisedById_idx ON requests ("raisedById");
CREATE INDEX requests_departmentId_idx ON requests ("departmentId");
CREATE INDEX requests_status_idx ON requests (status);
CREATE INDEX requests_category_idx ON requests (category);
CREATE INDEX requests_academicSection_idx ON requests ("academicSection");
CREATE INDEX requests_clubId_idx ON requests ("clubId");
CREATE INDEX requests_createdAt_idx ON requests ("createdAt");

CREATE TABLE request_attachments (
  id              TEXT PRIMARY KEY,
  "requestId"     TEXT NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
  "fileName"      TEXT NOT NULL,
  "filePath"      TEXT NOT NULL,
  "fileSize"      INTEGER NOT NULL,
  "mimeType"      TEXT NOT NULL,
  "uploadedById"  TEXT NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX request_attachments_requestId_idx ON request_attachments ("requestId");

-- ─── APPROVAL HISTORY & REMARKS ──────────────────────────────────────────────

CREATE TABLE approval_history (
  id                TEXT PRIMARY KEY,
  "requestId"       TEXT NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
  "stepOrder"       INTEGER NOT NULL,
  "roleCode"        "RoleCode" NOT NULL,
  action            "ApprovalAction" NOT NULL,
  "actorId"         TEXT NOT NULL REFERENCES users (id),
  remarks           TEXT,
  "previousStatus"  "RequestStatus",
  "newStatus"       "RequestStatus",
  metadata          JSONB,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX approval_history_requestId_idx ON approval_history ("requestId");
CREATE INDEX approval_history_actorId_idx ON approval_history ("actorId");
CREATE INDEX approval_history_createdAt_idx ON approval_history ("createdAt");

CREATE TABLE remarks (
  id            TEXT PRIMARY KEY,
  "requestId"   TEXT NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
  "authorId"    TEXT NOT NULL REFERENCES users (id),
  content       TEXT NOT NULL,
  "isInternal"  BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX remarks_requestId_idx ON remarks ("requestId");

-- ─── NOTIFICATIONS & AUDIT ───────────────────────────────────────────────────

CREATE TABLE notifications (
  id            TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type          "NotificationType" NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  link          TEXT,
  "isRead"      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata      JSONB,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_userId_isRead_idx ON notifications ("userId", "isRead");
CREATE INDEX notifications_createdAt_idx ON notifications ("createdAt");

CREATE TABLE audit_logs (
  id            TEXT PRIMARY KEY,
  "userId"      TEXT REFERENCES users (id),
  action        TEXT NOT NULL,
  "entityType"  TEXT NOT NULL,
  "entityId"    TEXT,
  "oldValue"    JSONB,
  "newValue"    JSONB,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_entityType_entityId_idx ON audit_logs ("entityType", "entityId");
CREATE INDEX audit_logs_userId_idx ON audit_logs ("userId");
CREATE INDEX audit_logs_createdAt_idx ON audit_logs ("createdAt");

CREATE TABLE workflow_logs (
  id            TEXT PRIMARY KEY,
  "requestId"   TEXT NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
  "userId"      TEXT REFERENCES users (id),
  event         TEXT NOT NULL,
  "fromStep"    INTEGER,
  "toStep"      INTEGER,
  "fromRole"    "RoleCode",
  "toRole"      "RoleCode",
  details       JSONB,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workflow_logs_requestId_idx ON workflow_logs ("requestId");

-- ─── ROW LEVEL SECURITY (optional — app uses custom auth + Prisma) ───────────
-- If you connect via Prisma service role / direct connection, RLS can stay off.
-- Uncomment below only if you expose tables via Supabase client with JWT.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... add policies per your auth model
