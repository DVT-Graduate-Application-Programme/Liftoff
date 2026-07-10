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
            ALTER TABLE public."ApplicationRecords"
                ADD COLUMN IF NOT EXISTS "CvAttachmentId" VARCHAR(2048) NULL,
                ADD COLUMN IF NOT EXISTS "TranscriptAttachmentId" VARCHAR(2048) NULL,
                ADD COLUMN IF NOT EXISTS "CandidateGitHubUrl" VARCHAR(2048) NULL,
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
                ADD COLUMN IF NOT EXISTS "RatedAt" TIMESTAMPTZ NULL;
            """);
    }
}
