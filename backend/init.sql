-- 1. In Postgres, database creation cannot happen inside a transaction block or script with other tables.

-- You typically create the database via docker-compose env variables (POSTGRES_DB=GradRecruitmentDb).

-- This script assumes you are already connected to your target database.
 
-- 2. Drop tables in reverse order of foreign keys if they exist

-- Postgres supports the elegant "CASCADE" modifier to drop dependent objects cleanly.

DROP TABLE IF EXISTS public."AuditLogs" CASCADE;

DROP TABLE IF EXISTS public."RecruiterActions" CASCADE;

DROP TABLE IF EXISTS public."HiringAgentEvaluations" CASCADE;

DROP TABLE IF EXISTS public."ApplicationRecords" CASCADE;
 
-- ==========================================

-- 1. APPLICATION RECORDS TABLE

-- ==========================================

CREATE TABLE public."ApplicationRecords" (

    "Id" UUID NOT NULL DEFAULT gen_random_uuid(),

    "EmailMessageId" VARCHAR(255) NOT NULL,

    "CandidateName" VARCHAR(255) NULL,

    "CandidateEmail" VARCHAR(255) NULL,

    "CvBlobUrl" VARCHAR(2048) NULL,

    "TranscriptBlobUrl" VARCHAR(2048) NULL,

    "Status" VARCHAR(50) NOT NULL,

    "HardGatePassed" BOOLEAN NULL,

    "HardGateReason" VARCHAR(504) NULL,

    "HiringAgentTotalScore" NUMERIC(5,2) NULL,

    "HiringAgentExplanation" TEXT NULL,

    "CandidateGitHubUrl" VARCHAR(2048) NULL,

    "ClaimedByRecruiterId" VARCHAR(255) NULL,

    "ClaimedAt" TIMESTAMPTZ NULL,

    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_ApplicationRecords" PRIMARY KEY ("Id"),

    CONSTRAINT "UQ_EmailMessageId" UNIQUE ("EmailMessageId")

);
 
-- ==========================================

-- 2. HIRING AGENT EVALUATIONS TABLE

-- ==========================================

CREATE TABLE public."HiringAgentEvaluations" (

    "Id" UUID NOT NULL DEFAULT gen_random_uuid(),

    "ApplicationRecordId" UUID NOT NULL,

    -- Postgres has native, deeply powerful binary JSON storage support (JSONB)

    "CategoryScoresJson" JSONB NULL,

    "EvidenceJson" JSONB NULL,

    "BonusPointsJson" JSONB NULL,

    "DeductionsJson" JSONB NULL,

    "GitHubProfileDataJson" JSONB NULL,

    "ProjectClassificationsJson" JSONB NULL,

    "ProcessedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_HiringAgentEvaluations" PRIMARY KEY ("Id"),

    CONSTRAINT "FK_HiringAgentEvaluations_ApplicationRecords" FOREIGN KEY ("ApplicationRecordId") 

        REFERENCES public."ApplicationRecords" ("Id") ON DELETE CASCADE

);
 
-- ==========================================

-- 3. RECRUITER ACTIONS TABLE

-- ==========================================

CREATE TABLE public."RecruiterActions" (

    "Id" UUID NOT NULL DEFAULT gen_random_uuid(),

    "ApplicationRecordId" UUID NOT NULL,

    "RecruiterIdentity" VARCHAR(255) NOT NULL,

    "ActionType" VARCHAR(50) NOT NULL,

    "PreviousStatus" VARCHAR(50) NULL,

    "NewStatus" VARCHAR(50) NULL,

    "Reason" TEXT NULL,

    "ActionedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_RecruiterActions" PRIMARY KEY ("Id"),

    CONSTRAINT "FK_RecruiterActions_ApplicationRecords" FOREIGN KEY ("ApplicationRecordId") 

        REFERENCES public."ApplicationRecords" ("Id") ON DELETE CASCADE

);
 
-- ==========================================

-- 4. AUDIT LOGS TABLE

-- ==========================================

CREATE TABLE public."AuditLogs" (

    "Id" UUID NOT NULL DEFAULT gen_random_uuid(),

    "ApplicationRecordId" UUID NULL,

    "SourceService" VARCHAR(100) NOT NULL,

    "LogLevel" VARCHAR(20) NOT NULL,

    "Message" TEXT NOT NULL,

    "ExceptionDetails" TEXT NULL,

    "Timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id"),

    CONSTRAINT "FK_AuditLogs_ApplicationRecords" FOREIGN KEY ("ApplicationRecordId") 

        REFERENCES public."ApplicationRecords" ("Id") ON DELETE SET NULL

);
 