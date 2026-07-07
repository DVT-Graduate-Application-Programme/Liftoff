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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.HasIndex(e => e.EmailMessageId).IsUnique();
            entity.Property(e => e.EmailMessageId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.CandidateName).HasMaxLength(255);
            entity.Property(e => e.CandidateEmail).HasMaxLength(255);
            entity.Property(e => e.CvAttachmentId).HasMaxLength(2048);
            entity.Property(e => e.TranscriptAttachmentId).HasMaxLength(2048);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.HardGateReason).HasMaxLength(504);
            entity.Property(e => e.HiringAgentTotalScore).HasColumnType("numeric(5,2)");
            entity.Property(e => e.CandidateGitHubUrl).HasMaxLength(2048);
            entity.Property(e => e.ClaimedByRecruiterId).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<HiringAgentEvaluation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.CategoryScoresJson).HasColumnType("jsonb");
            entity.Property(e => e.EvidenceJson).HasColumnType("jsonb");
            entity.Property(e => e.BonusPointsJson).HasColumnType("jsonb");
            entity.Property(e => e.DeductionsJson).HasColumnType("jsonb");
            entity.Property(e => e.GitHubProfileDataJson).HasColumnType("jsonb");
            entity.Property(e => e.ProjectClassificationsJson).HasColumnType("jsonb");
            entity.Property(e => e.ProcessedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.ApplicationRecord)
                .WithMany(p => p.HiringAgentEvaluations)
                .HasForeignKey(d => d.ApplicationRecordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RecruiterAction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.RecruiterIdentity).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ActionType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PreviousStatus).HasMaxLength(50);
            entity.Property(e => e.NewStatus).HasMaxLength(50);
            entity.Property(e => e.ActionedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.ApplicationRecord)
                .WithMany(p => p.RecruiterActions)
                .HasForeignKey(d => d.ApplicationRecordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.SourceService).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LogLevel).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.ApplicationRecord)
                .WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.ApplicationRecordId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
