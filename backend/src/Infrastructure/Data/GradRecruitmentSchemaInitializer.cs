using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data;

public static class GradRecruitmentSchemaInitializer
{
    public static async Task EnsureSchemaAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<GradRecruitmentDbContext>();

        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE EXTENSION IF NOT EXISTS pgcrypto;

            CREATE TABLE IF NOT EXISTS public."ApplicationRecords" (
                "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "EmailMessageId" VARCHAR(255) NOT NULL,
                "CandidateName" VARCHAR(255) NULL,
                "CandidateEmail" VARCHAR(255) NULL,
                "CandidateGitHubUrl" VARCHAR(2048) NULL,
                "CvAttachmentId" VARCHAR(2048) NULL,
                "TranscriptAttachmentId" VARCHAR(2048) NULL,
                "Status" VARCHAR(50) NOT NULL,
                "Tier" VARCHAR(20) NULL,
                "HardGatePassed" BOOLEAN NULL,
                "HardGateReason" VARCHAR(504) NULL,
                "HiringAgentTotalScore" NUMERIC(5,2) NULL,
                "HiringAgentExplanation" TEXT NULL,
                "CvSummary" TEXT NULL,
                "FlagsJson" JSONB NULL,
                "ClaimedByRecruiterId" VARCHAR(255) NULL,
                "ClaimedAt" TIMESTAMPTZ NULL,
                "ShortlistedByRecruiterId" VARCHAR(255) NULL,
                "ShortlistedAt" TIMESTAMPTZ NULL,
                "RecruiterRating" SMALLINT NULL CHECK ("RecruiterRating" BETWEEN 1 AND 5),
                "RecruiterRatingNote" TEXT NULL,
                "RatedByRecruiterId" VARCHAR(255) NULL,
                "RatedAt" TIMESTAMPTZ NULL,
                "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_ApplicationRecords" PRIMARY KEY ("Id"),
                CONSTRAINT "UQ_EmailMessageId" UNIQUE ("EmailMessageId")
            );

            CREATE TABLE IF NOT EXISTS public."HiringAgentEvaluations" (
                "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "ApplicationRecordId" UUID NOT NULL,
                "InstitutionJson" JSONB NULL,
                "CategoryScoresJson" JSONB NULL,
                "EvidenceJson" JSONB NULL,
                "BonusPointsJson" JSONB NULL,
                "DeductionsJson" JSONB NULL,
                "KeyStrengthsJson" JSONB NULL,
                "AreasForImprovementJson" JSONB NULL,
                "GitHubProfileDataJson" JSONB NULL,
                "ProjectClassificationsJson" JSONB NULL,
                "AiSummary" TEXT NULL,
                "ProcessedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_HiringAgentEvaluations" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_HiringAgentEvaluations_ApplicationRecords" FOREIGN KEY ("ApplicationRecordId")
                    REFERENCES public."ApplicationRecords" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS public."RecruiterActions" (
                "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "ApplicationRecordId" UUID NOT NULL,
                "RecruiterIdentity" VARCHAR(255) NOT NULL,
                "ActionType" VARCHAR(50) NOT NULL,
                "PreviousStatus" VARCHAR(50) NULL,
                "NewStatus" VARCHAR(50) NULL,
                "Reason" TEXT NULL,
                "RatingValue" SMALLINT NULL CHECK ("RatingValue" BETWEEN 1 AND 5),
                "ActionedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_RecruiterActions" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_RecruiterActions_ApplicationRecords" FOREIGN KEY ("ApplicationRecordId")
                    REFERENCES public."ApplicationRecords" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS public."AuditLogs" (
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

            CREATE TABLE IF NOT EXISTS public."Recruiters" (
                "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "IdentityId" VARCHAR(255) NOT NULL,
                "FirstName" VARCHAR(100) NOT NULL,
                "LastName" VARCHAR(100) NOT NULL,
                "Email" VARCHAR(255) NOT NULL,
                "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
                "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_Recruiters" PRIMARY KEY ("Id"),
                CONSTRAINT "UQ_Recruiters_IdentityId" UNIQUE ("IdentityId"),
                CONSTRAINT "UQ_Recruiters_Email" UNIQUE ("Email")
            );

            ALTER TABLE public."ApplicationRecords"
                ADD COLUMN IF NOT EXISTS "Id" UUID DEFAULT gen_random_uuid(),
                ADD COLUMN IF NOT EXISTS "EmailMessageId" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "CandidateName" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "CandidateEmail" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "CandidateGitHubUrl" VARCHAR(2048) NULL,
                ADD COLUMN IF NOT EXISTS "CvAttachmentId" VARCHAR(2048) NULL,
                ADD COLUMN IF NOT EXISTS "TranscriptAttachmentId" VARCHAR(2048) NULL,
                ADD COLUMN IF NOT EXISTS "Status" VARCHAR(50) NULL,
                ADD COLUMN IF NOT EXISTS "Tier" VARCHAR(20) NULL,
                ADD COLUMN IF NOT EXISTS "HardGatePassed" BOOLEAN NULL,
                ADD COLUMN IF NOT EXISTS "HardGateReason" VARCHAR(504) NULL,
                ADD COLUMN IF NOT EXISTS "HiringAgentTotalScore" NUMERIC(5,2) NULL,
                ADD COLUMN IF NOT EXISTS "HiringAgentExplanation" TEXT NULL,
                ADD COLUMN IF NOT EXISTS "CvSummary" TEXT NULL,
                ADD COLUMN IF NOT EXISTS "FlagsJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "ClaimedByRecruiterId" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "ClaimedAt" TIMESTAMPTZ NULL,
                ADD COLUMN IF NOT EXISTS "ShortlistedByRecruiterId" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "ShortlistedAt" TIMESTAMPTZ NULL,
                ADD COLUMN IF NOT EXISTS "RecruiterRating" SMALLINT NULL,
                ADD COLUMN IF NOT EXISTS "RecruiterRatingNote" TEXT NULL,
                ADD COLUMN IF NOT EXISTS "RatedByRecruiterId" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "RatedAt" TIMESTAMPTZ NULL,
                ADD COLUMN IF NOT EXISTS "CreatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS "UpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE public."HiringAgentEvaluations"
                ADD COLUMN IF NOT EXISTS "Id" UUID DEFAULT gen_random_uuid(),
                ADD COLUMN IF NOT EXISTS "ApplicationRecordId" UUID NULL,
                ADD COLUMN IF NOT EXISTS "InstitutionJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "CategoryScoresJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "EvidenceJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "BonusPointsJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "DeductionsJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "KeyStrengthsJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "AreasForImprovementJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "GitHubProfileDataJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "ProjectClassificationsJson" JSONB NULL,
                ADD COLUMN IF NOT EXISTS "AiSummary" TEXT NULL,
                ADD COLUMN IF NOT EXISTS "ProcessedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE public."RecruiterActions"
                ADD COLUMN IF NOT EXISTS "Id" UUID DEFAULT gen_random_uuid(),
                ADD COLUMN IF NOT EXISTS "ApplicationRecordId" UUID NULL,
                ADD COLUMN IF NOT EXISTS "RecruiterIdentity" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "ActionType" VARCHAR(50) NULL,
                ADD COLUMN IF NOT EXISTS "PreviousStatus" VARCHAR(50) NULL,
                ADD COLUMN IF NOT EXISTS "NewStatus" VARCHAR(50) NULL,
                ADD COLUMN IF NOT EXISTS "Reason" TEXT NULL,
                ADD COLUMN IF NOT EXISTS "RatingValue" SMALLINT NULL,
                ADD COLUMN IF NOT EXISTS "ActionedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE public."AuditLogs"
                ADD COLUMN IF NOT EXISTS "Id" UUID DEFAULT gen_random_uuid(),
                ADD COLUMN IF NOT EXISTS "ApplicationRecordId" UUID NULL,
                ADD COLUMN IF NOT EXISTS "SourceService" VARCHAR(100) NULL,
                ADD COLUMN IF NOT EXISTS "LogLevel" VARCHAR(20) NULL,
                ADD COLUMN IF NOT EXISTS "Message" TEXT NULL,
                ADD COLUMN IF NOT EXISTS "ExceptionDetails" TEXT NULL,
                ADD COLUMN IF NOT EXISTS "Timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE public."Recruiters"
                ADD COLUMN IF NOT EXISTS "Id" UUID DEFAULT gen_random_uuid(),
                ADD COLUMN IF NOT EXISTS "IdentityId" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "FirstName" VARCHAR(100) NULL,
                ADD COLUMN IF NOT EXISTS "LastName" VARCHAR(100) NULL,
                ADD COLUMN IF NOT EXISTS "Email" VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS "IsActive" BOOLEAN DEFAULT TRUE,
                ADD COLUMN IF NOT EXISTS "CreatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS "UpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
            """);
    }
}
