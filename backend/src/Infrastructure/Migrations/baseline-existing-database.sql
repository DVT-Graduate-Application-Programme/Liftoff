-- Baseline an existing database onto EF Core migrations.
--
-- Run this ONCE against any database whose schema was created by the old
-- GradRecruitmentSchemaInitializer / init.sql (that is: every environment deployed before
-- migrations were introduced). It is idempotent and safe to re-run.
--
-- Without it, the migrations job would try to apply InitialCreate against tables that
-- already exist and fail with "relation \"ApplicationRecords\" already exists".
--
--   psql "$CONNECTION_STRING" -f baseline-existing-database.sql
--
-- A brand-new, empty database needs NOTHING from this file — just let the migrations job
-- run InitialCreate normally.
--
-- Verify a database needs baselining:
--   SELECT to_regclass('public."ApplicationRecords"') IS NOT NULL AS has_tables,
--          to_regclass('public."__EFMigrationsHistory"') IS NOT NULL AS has_history;
--   has_tables = true AND has_history = false  ->  baseline it.

BEGIN;

-- 1. The ledger EF uses to decide what still needs applying.
CREATE TABLE IF NOT EXISTS public."__EFMigrationsHistory" (
    "MigrationId"    character varying(150) NOT NULL,
    "ProductVersion" character varying(32)  NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- 2. Close the one real gap between the old hand-written DDL and InitialCreate.
--    EF indexes every foreign key; the old schema created none of these. Adding them here
--    means a baselined database ends up structurally identical to one built from scratch
--    by the migration, so later migrations that touch these indexes behave the same in
--    both. They are also a straight win for the dashboard's per-application joins.
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_ApplicationRecordId"
    ON public."AuditLogs" ("ApplicationRecordId");

CREATE INDEX IF NOT EXISTS "IX_HiringAgentEvaluations_ApplicationRecordId"
    ON public."HiringAgentEvaluations" ("ApplicationRecordId");

CREATE INDEX IF NOT EXISTS "IX_RecruiterActions_ApplicationRecordId"
    ON public."RecruiterActions" ("ApplicationRecordId");

-- Deliberately no CREATE EXTENSION pgcrypto here. gen_random_uuid() has been core
-- PostgreSQL since 13, so the column defaults need no extension, and Azure Database for
-- PostgreSQL rejects the statement outright unless an operator adds pgcrypto to the
-- azure.extensions allow-list.

-- 3. Record InitialCreate as already applied, so the migrations job skips it and starts
--    from the next migration. ON CONFLICT makes re-running this file a no-op.
INSERT INTO public."__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260729065950_InitialCreate', '10.0.9')
ON CONFLICT ("MigrationId") DO NOTHING;

COMMIT;

-- ── Known, accepted difference ───────────────────────────────────────────────────────
-- The old DDL declared UQ_EmailMessageId, UQ_Recruiters_IdentityId and UQ_Recruiters_Email
-- as UNIQUE *constraints*; InitialCreate creates unique *indexes* of the same names. They
-- enforce identical uniqueness and share the same names, so queries, inserts and the EF
-- model are unaffected. The difference only surfaces if a future migration tries to DROP
-- INDEX on one of them in a baselined database, where it must be dropped as a constraint
-- instead. If you ever need them fully aligned, run (per constraint, outside this script):
--   ALTER TABLE public."ApplicationRecords" DROP CONSTRAINT "UQ_EmailMessageId";
--   CREATE UNIQUE INDEX "UQ_EmailMessageId" ON public."ApplicationRecords" ("EmailMessageId");
