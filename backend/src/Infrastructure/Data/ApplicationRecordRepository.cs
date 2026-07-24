using Application.Interfaces;
using Application.Queries.GetDashboardApplications;
using Application.Queries.GetDashboardMetrics;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Data;

public partial class ApplicationRecordRepository : IApplicationRecordRepository
{
    private readonly GradRecruitmentDbContext _dbContext;
    private readonly IApplicationEventService _events;

    public ApplicationRecordRepository(
        GradRecruitmentDbContext dbContext,
        IApplicationEventService events)
    {
        _dbContext = dbContext;
        _events = events;
    }

    public async Task<List<ApplicationRecord>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.ApplicationRecords
            .AsNoTracking()
            .Include(r => r.HiringAgentEvaluations)
            .Include(r => r.RecruiterActions)
            .Include(r => r.AuditLogs)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<ApplicationRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ApplicationRecords
            .AsNoTracking()
            .Include(r => r.HiringAgentEvaluations)
            .Include(r => r.RecruiterActions)
            .Include(r => r.AuditLogs)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<ApplicationRecord?> GetByEmailMessageIdAsync(string emailMessageId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ApplicationRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.EmailMessageId == emailMessageId, cancellationToken);
    }


    public async Task<ApplicationOwnershipClaim?> ClaimOwnershipAsync(
        Guid id,
        string recruiterIdentity,
        CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (applicationRecord is null)
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        applicationRecord.ClaimedByRecruiterId = recruiterIdentity;
        applicationRecord.ClaimedAt = now;
        applicationRecord.UpdatedAt = now;

        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "CLAIM",
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, "CLAIM");

        return new ApplicationOwnershipClaim
        {
            ClaimedByRecruiterId = recruiterIdentity,
            ClaimedAt = now
        };
    }

    public async Task<ApplicationOwnershipShortlist?> ShortlistAsync(
        Guid id,
        string recruiterIdentity,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (applicationRecord is null)
        {
            return null;
        }

        const string shortlistedStatus = "SHORTLISTED";
        var now = DateTimeOffset.UtcNow;
        var previousStatus = applicationRecord.Status;

        applicationRecord.ShortlistedByRecruiterId = recruiterIdentity;
        applicationRecord.ShortlistedAt = now;
        applicationRecord.Status = shortlistedStatus;
        applicationRecord.UpdatedAt = now;

        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "SHORTLIST",
            PreviousStatus = previousStatus,
            NewStatus = shortlistedStatus,
            Reason = reason,
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, "SHORTLIST");

        return new ApplicationOwnershipShortlist
        {
            ShortlistedByRecruiterId = recruiterIdentity,
            ShortlistedAt = now,
            UpdatedStatus = shortlistedStatus
        };
    }

    public async Task<ApplicationStatusUpdate?> AcceptAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        return await UpdateStatusAsync(id, recruiterIdentity, "ACCEPTED", reason, cancellationToken);
    }

    public async Task<ApplicationStatusUpdate?> RejectAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        return await UpdateStatusAsync(id, recruiterIdentity, "REJECTED", reason, cancellationToken);
    }

    private async Task<ApplicationStatusUpdate?> UpdateStatusAsync(Guid id, string recruiterIdentity, string newStatus, string? reason, CancellationToken cancellationToken)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;
        var previousStatus = applicationRecord.Status;

        applicationRecord.Status = newStatus;
        applicationRecord.UpdatedAt = now;
        if (newStatus == "REJECTED")
        {
            applicationRecord.ShortlistedByRecruiterId = null;
            applicationRecord.ShortlistedAt = null;
            
        }
        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "STATUS_OVERRIDE",
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Reason = reason,
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, newStatus);

        return new ApplicationStatusUpdate
        {
            ActionedByRecruiterId = recruiterIdentity,
            ActionedAt = now,
            UpdatedStatus = newStatus
        };
    }

    public async Task<ApplicationRatingUpdate?> RateAsync(Guid id, string recruiterIdentity, short rating, string? notes, CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;

        applicationRecord.RecruiterRating = rating;
        if (notes is null && applicationRecord.RecruiterRatingNote is not null) {
            // keep old notes
        } else {
            applicationRecord.RecruiterRatingNote = notes;
        }
        applicationRecord.RatedByRecruiterId = recruiterIdentity;
        applicationRecord.RatedAt = now;
        applicationRecord.UpdatedAt = now;

        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "RATING",
            RatingValue = rating,
            Reason = notes,
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, "RATING");

        return new ApplicationRatingUpdate
        {
            RatedByRecruiterId = recruiterIdentity,
            RatedAt = now,
            RecruiterRating = applicationRecord.RecruiterRating,
            RecruiterRatingNote = applicationRecord.RecruiterRatingNote
        };
    }

    public async Task<ApplicationRatingUpdate?> AddNotesAsync(Guid id, string recruiterIdentity, string notes, CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;

        applicationRecord.RecruiterRatingNote = notes;
        applicationRecord.UpdatedAt = now;

        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "RATING",
            RatingValue = applicationRecord.RecruiterRating,
            Reason = notes,
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, "NOTES");

        return new ApplicationRatingUpdate
        {
            RatedByRecruiterId = applicationRecord.RatedByRecruiterId ?? string.Empty,
            RatedAt = applicationRecord.RatedAt ?? now,
            RecruiterRating = applicationRecord.RecruiterRating,
            RecruiterRatingNote = notes
        };
    }






    public async Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
    {
        var statusCounts = await _dbContext.ApplicationRecords
            .AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var counts = statusCounts.ToDictionary(a => a.Status, a => a.Count);

        return new DashboardMetricsDto
        {
            TotalApplications = statusCounts.Sum(a => a.Count),
            PendingApplications = counts.GetValueOrDefault("PENDING"),
            ProcessingApplications = counts.GetValueOrDefault("PROCESSING"),
            ValidApplications = counts.GetValueOrDefault("VALID"),
            InvalidApplications = counts.GetValueOrDefault("INVALID"),
            ManualReviewApplications = counts.GetValueOrDefault("MANUAL_REVIEW"),
            ShortlistedApplications = counts.GetValueOrDefault("SHORTLISTED"),
            ErrorApplications = counts.GetValueOrDefault("ERROR")
        };
    }

    public async Task<bool> ExistsAsync(string emailMessageId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ApplicationRecords
            .AnyAsync(r => r.EmailMessageId == emailMessageId, cancellationToken);
    }

    public async Task AddAsync(ApplicationRecord record, CancellationToken cancellationToken = default)
    {
        await _dbContext.ApplicationRecords.AddAsync(record, cancellationToken);
        _events.PublishApplicationIngested(record.Id);
    }

    public async Task<bool> AddEvaluationAsync(
        Guid applicationId,
        HiringAgentEvaluation evaluation,
        string status,
        decimal totalScore,
        string tier,
        bool hardGatePassed,
        string hardGateReason,
        string? cvSummary,
        JsonDocument? flagsJson,
        CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords
            .FirstOrDefaultAsync(r => r.Id == applicationId, cancellationToken);

        if (applicationRecord is null)
        {
            return false;
        }

        evaluation.ApplicationRecordId = applicationId;

        applicationRecord.Status = status;
        applicationRecord.Tier = tier;
        applicationRecord.HardGatePassed = hardGatePassed;
        applicationRecord.HardGateReason = hardGateReason;
        applicationRecord.HiringAgentTotalScore = totalScore;
        applicationRecord.HiringAgentExplanation = cvSummary;
        applicationRecord.CvSummary = cvSummary;
        applicationRecord.FlagsJson = flagsJson;
        applicationRecord.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.HiringAgentEvaluations.AddAsync(evaluation, cancellationToken);
        _events.PublishEvaluationSaved(applicationId);
        return true;
    }

    public async Task<bool> ResetEvaluationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords
            .Include(r => r.HiringAgentEvaluations)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (applicationRecord is null)
        {
            return false;
        }

        // Remove any existing evaluations
        if (applicationRecord.HiringAgentEvaluations.Any())
        {
            _dbContext.HiringAgentEvaluations.RemoveRange(applicationRecord.HiringAgentEvaluations);
        }

        // Reset fields
        applicationRecord.Tier = null;
        applicationRecord.HardGatePassed = null;
        applicationRecord.HardGateReason = null;
        applicationRecord.HiringAgentTotalScore = null;
        applicationRecord.HiringAgentExplanation = null;
        applicationRecord.CvSummary = null;
        applicationRecord.FlagsJson = null;
        applicationRecord.Status = "PENDING";
        applicationRecord.UpdatedAt = DateTimeOffset.UtcNow;

        _events.PublishEvaluationReset(id);
        return true;
    }

    public async Task AddAuditLogAsync(AuditLog auditLog, CancellationToken cancellationToken = default)
    {
        await _dbContext.AuditLogs.AddAsync(auditLog, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }



}
