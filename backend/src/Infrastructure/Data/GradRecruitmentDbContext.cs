using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class GradRecruitmentDbContext : DbContext
{
    public GradRecruitmentDbContext(DbContextOptions<GradRecruitmentDbContext> options)
        : base(options)
    {
    }

    public DbSet<ApplicationRecord> ApplicationRecords { get; set; } = null!;
    public DbSet<HiringAgentEvaluation> HiringAgentEvaluations { get; set; } = null!;
    public DbSet<RecruiterAction> RecruiterActions { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<Recruiter> Recruiters { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // No pgcrypto extension: gen_random_uuid() has been core PostgreSQL since 13, and
        // every server here runs 16. The old schema initializer created the extension
        // explicitly, but Azure Database for PostgreSQL refuses it unless an operator adds
        // it to the azure.extensions allow-list — requesting it would make the migration
        // fail on Azure for a function the server already provides.
        modelBuilder.Entity<ApplicationRecord>(entity =>
        {
            // Constraint and index names below are pinned to the names the previously
            // hand-written DDL produced, so an existing database can be baselined into
            // __EFMigrationsHistory without the two schemas drifting apart.
            entity.ToTable("ApplicationRecords", t =>
            {
                t.HasCheckConstraint("ApplicationRecords_RecruiterRating_check", "\"RecruiterRating\" BETWEEN 1 AND 5");
                t.HasCheckConstraint("ApplicationRecords_TechnicalRating_check", "\"TechnicalRating\" BETWEEN 1 AND 5");
            });
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName(nameof(ApplicationRecord.Id)).HasDefaultValueSql("gen_random_uuid()");
            entity.HasIndex(e => e.EmailMessageId).IsUnique().HasDatabaseName("UQ_EmailMessageId");

            // Ingest fields
            entity.Property(e => e.EmailMessageId).HasColumnName(nameof(ApplicationRecord.EmailMessageId)).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CandidateName).HasColumnName(nameof(ApplicationRecord.CandidateName)).HasMaxLength(255);
            entity.Property(e => e.CandidateEmail).HasColumnName(nameof(ApplicationRecord.CandidateEmail)).HasMaxLength(255);
            entity.Property(e => e.CandidateGitHubUrl).HasColumnName(nameof(ApplicationRecord.CandidateGitHubUrl)).HasMaxLength(2048);
            entity.Property(e => e.CvAttachmentId).HasColumnName(nameof(ApplicationRecord.CvAttachmentId)).HasMaxLength(2048);
            entity.Property(e => e.TranscriptAttachmentId).HasColumnName(nameof(ApplicationRecord.TranscriptAttachmentId)).HasMaxLength(2048);

            // Status and tier
            entity.Property(e => e.Status).HasColumnName(nameof(ApplicationRecord.Status)).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Tier).HasColumnName(nameof(ApplicationRecord.Tier)).HasMaxLength(20);

            // Hard gate
            entity.Property(e => e.HardGatePassed).HasColumnName(nameof(ApplicationRecord.HardGatePassed));
            entity.Property(e => e.HardGateReason).HasColumnName(nameof(ApplicationRecord.HardGateReason)).HasMaxLength(504);

            // Hiring Agent summary
            entity.Property(e => e.HiringAgentTotalScore).HasColumnName(nameof(ApplicationRecord.HiringAgentTotalScore)).HasColumnType("numeric(5,2)");
            entity.Property(e => e.HiringAgentExplanation).HasColumnName(nameof(ApplicationRecord.HiringAgentExplanation));
            entity.Property(e => e.CvSummary).HasColumnName(nameof(ApplicationRecord.CvSummary));
            entity.Property(e => e.FlagsJson).HasColumnName(nameof(ApplicationRecord.FlagsJson)).HasColumnType("jsonb");

            // Claim ownership
            entity.Property(e => e.ClaimedByRecruiterId).HasColumnName(nameof(ApplicationRecord.ClaimedByRecruiterId)).HasMaxLength(255);
            entity.Property(e => e.ClaimedAt).HasColumnName(nameof(ApplicationRecord.ClaimedAt));

            // Shortlist ownership
            entity.Property(e => e.ShortlistedByRecruiterId).HasColumnName(nameof(ApplicationRecord.ShortlistedByRecruiterId)).HasMaxLength(255);
            entity.Property(e => e.ShortlistedAt).HasColumnName(nameof(ApplicationRecord.ShortlistedAt));

            // Recruiter rating
            entity.Property(e => e.RecruiterRating).HasColumnName(nameof(ApplicationRecord.RecruiterRating));
            entity.Property(e => e.RecruiterRatingNote).HasColumnName(nameof(ApplicationRecord.RecruiterRatingNote));
            entity.Property(e => e.TechnicalRating).HasColumnName(nameof(ApplicationRecord.TechnicalRating));
            entity.Property(e => e.RatedByRecruiterId).HasColumnName(nameof(ApplicationRecord.RatedByRecruiterId)).HasMaxLength(255);
            entity.Property(e => e.RatedAt).HasColumnName(nameof(ApplicationRecord.RatedAt));

            // Timestamps
            entity.Property(e => e.CreatedAt).HasColumnName(nameof(ApplicationRecord.CreatedAt)).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName(nameof(ApplicationRecord.UpdatedAt)).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<HiringAgentEvaluation>(entity =>
        {
            entity.ToTable("HiringAgentEvaluations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName(nameof(HiringAgentEvaluation.Id)).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ApplicationRecordId).HasColumnName(nameof(HiringAgentEvaluation.ApplicationRecordId));

            entity.Property(e => e.InstitutionJson).HasColumnName(nameof(HiringAgentEvaluation.InstitutionJson)).HasColumnType("jsonb");
            entity.Property(e => e.CategoryScoresJson).HasColumnName(nameof(HiringAgentEvaluation.CategoryScoresJson)).HasColumnType("jsonb");
            entity.Property(e => e.EvidenceJson).HasColumnName(nameof(HiringAgentEvaluation.EvidenceJson)).HasColumnType("jsonb");
            entity.Property(e => e.BonusPointsJson).HasColumnName(nameof(HiringAgentEvaluation.BonusPointsJson)).HasColumnType("jsonb");
            entity.Property(e => e.DeductionsJson).HasColumnName(nameof(HiringAgentEvaluation.DeductionsJson)).HasColumnType("jsonb");
            entity.Property(e => e.KeyStrengthsJson).HasColumnName(nameof(HiringAgentEvaluation.KeyStrengthsJson)).HasColumnType("jsonb");
            entity.Property(e => e.AreasForImprovementJson).HasColumnName(nameof(HiringAgentEvaluation.AreasForImprovementJson)).HasColumnType("jsonb");
            entity.Property(e => e.GitHubProfileDataJson).HasColumnName(nameof(HiringAgentEvaluation.GitHubProfileDataJson)).HasColumnType("jsonb");
            entity.Property(e => e.ProjectClassificationsJson).HasColumnName(nameof(HiringAgentEvaluation.ProjectClassificationsJson)).HasColumnType("jsonb");
            entity.Property(e => e.AiSummary).HasColumnName(nameof(HiringAgentEvaluation.AiSummary));
            entity.Property(e => e.ProcessedAt).HasColumnName(nameof(HiringAgentEvaluation.ProcessedAt)).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.ApplicationRecord)
                .WithMany(p => p.HiringAgentEvaluations)
                .HasForeignKey(d => d.ApplicationRecordId)
                .HasConstraintName("FK_HiringAgentEvaluations_ApplicationRecords")
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RecruiterAction>(entity =>
        {
            entity.ToTable("RecruiterActions", t => t.HasCheckConstraint(
                "RecruiterActions_RatingValue_check",
                "\"RatingValue\" BETWEEN 1 AND 5"));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName(nameof(RecruiterAction.Id)).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ApplicationRecordId).HasColumnName(nameof(RecruiterAction.ApplicationRecordId));
            entity.Property(e => e.RecruiterIdentity).HasColumnName(nameof(RecruiterAction.RecruiterIdentity)).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ActionType).HasColumnName(nameof(RecruiterAction.ActionType)).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PreviousStatus).HasColumnName(nameof(RecruiterAction.PreviousStatus)).HasMaxLength(50);
            entity.Property(e => e.NewStatus).HasColumnName(nameof(RecruiterAction.NewStatus)).HasMaxLength(50);
            entity.Property(e => e.Reason).HasColumnName(nameof(RecruiterAction.Reason));
            entity.Property(e => e.RatingValue).HasColumnName(nameof(RecruiterAction.RatingValue));
            entity.Property(e => e.ActionedAt).HasColumnName(nameof(RecruiterAction.ActionedAt)).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.ApplicationRecord)
                .WithMany(p => p.RecruiterActions)
                .HasForeignKey(d => d.ApplicationRecordId)
                .HasConstraintName("FK_RecruiterActions_ApplicationRecords")
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName(nameof(AuditLog.Id)).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ApplicationRecordId).HasColumnName(nameof(AuditLog.ApplicationRecordId));
            entity.Property(e => e.SourceService).HasColumnName(nameof(AuditLog.SourceService)).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LogLevel).HasColumnName(nameof(AuditLog.LogLevel)).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Message).HasColumnName(nameof(AuditLog.Message)).IsRequired();
            entity.Property(e => e.ExceptionDetails).HasColumnName(nameof(AuditLog.ExceptionDetails));
            entity.Property(e => e.Timestamp).HasColumnName(nameof(AuditLog.Timestamp)).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.ApplicationRecord)
                .WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.ApplicationRecordId)
                .HasConstraintName("FK_AuditLogs_ApplicationRecords")
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Recruiter>(entity =>
        {
            entity.ToTable("Recruiters");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName(nameof(Recruiter.Id)).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.IdentityId).HasColumnName(nameof(Recruiter.IdentityId)).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.IdentityId).IsUnique().HasDatabaseName("UQ_Recruiters_IdentityId");
            entity.Property(e => e.FirstName).HasColumnName(nameof(Recruiter.FirstName)).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).HasColumnName(nameof(Recruiter.LastName)).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).HasColumnName(nameof(Recruiter.Email)).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique().HasDatabaseName("UQ_Recruiters_Email");
            entity.Property(e => e.IsActive).HasColumnName(nameof(Recruiter.IsActive)).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName(nameof(Recruiter.CreatedAt)).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName(nameof(Recruiter.UpdatedAt)).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Ignore(e => e.FullName);
        });
    }
}
