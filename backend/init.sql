-- 1. In Postgres, database creation cannot happen inside a transaction block or script with other tables.
-- You typically create the database via docker-compose env variables (POSTGRES_DB=GradRecruitmentDb).
-- This script assumes you are already connected to your target database.

-- 2. Drop tables in reverse order of foreign keys if they exist.
DROP TABLE IF EXISTS public."AuditLogs" CASCADE;
DROP TABLE IF EXISTS public."RecruiterActions" CASCADE;
DROP TABLE IF EXISTS public."HiringAgentEvaluations" CASCADE;
DROP TABLE IF EXISTS public."ApplicationRecords" CASCADE;

-- ==========================================
-- 1. APPLICATION RECORDS TABLE
-- ==========================================

CREATE TABLE public."ApplicationRecords" (
    "Id"                        UUID            NOT NULL DEFAULT gen_random_uuid(),

    -- Ingest fields
    "EmailMessageId"            VARCHAR(255)    NOT NULL,
    "CandidateName"             VARCHAR(255)    NULL,
    "CandidateEmail"            VARCHAR(255)    NULL,
    "CandidateGitHubUrl"        VARCHAR(2048)   NULL,
    "CvAttachmentId"                  VARCHAR(2048)   NULL,
    "TranscriptAttachmentId"         VARCHAR(2048)   NULL,
    -- Status and tier
    -- Status values: PENDING | PROCESSING | VALID | INVALID | MANUAL_REVIEW | SHORTLISTED | ERROR
    "Status"                    VARCHAR(50)     NOT NULL,
    -- Tier values: STRONG | BORDERLINE | WEAK | INVALID
    "Tier"                      VARCHAR(20)     NULL,

    -- Hard gate screening (deterministic pass/fail)
    "HardGatePassed"            BOOLEAN         NULL,
    "HardGateReason"            VARCHAR(504)    NULL,

    -- Hiring Agent evaluation summary (denormalised for dashboard card performance)
    "HiringAgentTotalScore"     NUMERIC(5,2)    NULL,
    "HiringAgentExplanation"    TEXT            NULL,
    "CvSummary"                 TEXT            NULL,
    -- Array of human-readable flag strings, e.g. ["No GitHub found", "Manual review required"]
    "FlagsJson"                 JSONB           NULL,

    -- Claim ownership (recruiter reviewing the application)
    "ClaimedByRecruiterId"      VARCHAR(255)    NULL,
    "ClaimedAt"                 TIMESTAMPTZ     NULL,

    -- Shortlist ownership (recruiter approving to progress)
    "ShortlistedByRecruiterId"  VARCHAR(255)    NULL,
    "ShortlistedAt"             TIMESTAMPTZ     NULL,

    -- Recruiter rating (denormalised from RecruiterActions for dashboard read performance;
    -- the full history of rating changes is preserved in RecruiterActions)
    "RecruiterRating"           SMALLINT        NULL CHECK ("RecruiterRating" BETWEEN 1 AND 5),
    "RecruiterRatingNote"       TEXT            NULL,
    "RatedByRecruiterId"        VARCHAR(255)    NULL,
    "RatedAt"                   TIMESTAMPTZ     NULL,

    -- Timestamps
    "CreatedAt"                 TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"                 TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_ApplicationRecords"  PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_EmailMessageId"      UNIQUE ("EmailMessageId")
);

-- ==========================================
-- 2. HIRING AGENT EVALUATIONS TABLE
-- ==========================================

CREATE TABLE public."HiringAgentEvaluations" (
    "Id"                            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "ApplicationRecordId"           UUID        NOT NULL,

    -- Institution: { name, degreeName }
    "InstitutionJson"               JSONB       NULL,

    -- Per-category scores: { open_source, self_projects, production, technical_skills }
    -- Each entry: { score, max, evidence }
    "CategoryScoresJson"            JSONB       NULL,

    -- Evidence per category (kept separate for targeted querying)
    "EvidenceJson"                  JSONB       NULL,

    -- Bonus points: { total, breakdown: { linkedin_profile, technical_communication, ... } }
    "BonusPointsJson"               JSONB       NULL,

    -- Deductions: { total, reasons: string[] }
    "DeductionsJson"                JSONB       NULL,

    -- Human-readable strengths and improvement areas (arrays of strings)
    "KeyStrengthsJson"              JSONB       NULL,
    "AreasForImprovementJson"       JSONB       NULL,

    -- Raw GitHub and project classification data from the Hiring Agent
    "GitHubProfileDataJson"         JSONB       NULL,
    "ProjectClassificationsJson"    JSONB       NULL,

    "ProcessedAt"                   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_HiringAgentEvaluations" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_HiringAgentEvaluations_ApplicationRecords" FOREIGN KEY ("ApplicationRecordId")
        REFERENCES public."ApplicationRecords" ("Id") ON DELETE CASCADE
);

-- ==========================================
-- 3. RECRUITER ACTIONS TABLE
-- ==========================================

CREATE TABLE public."RecruiterActions" (
    "Id"                    UUID            NOT NULL DEFAULT gen_random_uuid(),
    "ApplicationRecordId"   UUID            NOT NULL,
    "RecruiterIdentity"     VARCHAR(255)    NOT NULL,

    -- ActionType values: CLAIM | SHORTLIST | RATING | STATUS_OVERRIDE | FORWARD
    "ActionType"            VARCHAR(50)     NOT NULL,

    -- Status transition fields (used when ActionType = STATUS_OVERRIDE)
    "PreviousStatus"        VARCHAR(50)     NULL,
    "NewStatus"             VARCHAR(50)     NULL,

    -- Optional justification (mandatory for STATUS_OVERRIDE, optional for SHORTLIST/RATING)
    "Reason"                TEXT            NULL,

    -- Rating value (used when ActionType = RATING; 1–5)
    -- Preserves full rating history even when ApplicationRecords is overwritten on re-rate
    "RatingValue"           SMALLINT        NULL CHECK ("RatingValue" BETWEEN 1 AND 5),

    "ActionedAt"            TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_RecruiterActions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RecruiterActions_ApplicationRecords" FOREIGN KEY ("ApplicationRecordId")
        REFERENCES public."ApplicationRecords" ("Id") ON DELETE CASCADE
);

-- ==========================================
-- 4. AUDIT LOGS TABLE
-- ==========================================

CREATE TABLE public."AuditLogs" (
    "Id"                    UUID            NOT NULL DEFAULT gen_random_uuid(),
    "ApplicationRecordId"   UUID            NULL,
    "SourceService"         VARCHAR(100)    NOT NULL,
    "LogLevel"              VARCHAR(20)     NOT NULL,
    "Message"               TEXT            NOT NULL,
    "ExceptionDetails"      TEXT            NULL,
    "Timestamp"             TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AuditLogs_ApplicationRecords" FOREIGN KEY ("ApplicationRecordId")
        REFERENCES public."ApplicationRecords" ("Id") ON DELETE SET NULL
);