using Application.Interfaces;
using Application.Queries.GetDashboardApplications;
using Application.Queries.GetDashboardMetrics;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Data;

public class ApplicationRecordRepository : IApplicationRecordRepository
{
    private readonly GradRecruitmentDbContext _dbContext;

    public ApplicationRecordRepository(GradRecruitmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ApplicationRecord>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.ApplicationRecords
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<ApplicationRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ApplicationRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<ApplicationRecord?> GetByEmailMessageIdAsync(string emailMessageId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ApplicationRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.EmailMessageId == emailMessageId, cancellationToken);
    }

    public Task<ApplicationDetails?> GetApplicationDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.ApplicationRecords
            .Where(r => r.Id == id)
            .Select(r => new ApplicationDetails
            {
                Id = r.Id,
                Status = r.Status,
                Tier = r.Tier,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Applicant?> GetApplicantByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.ApplicationRecords
            .Where(r => r.Id == id)
            .Select(r => new Applicant
            {
                CandidateName = r.CandidateName,
                CandidateEmail = r.CandidateEmail,
                CandidateGitHubUrl = r.CandidateGitHubUrl
            })
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<ApplicationHardGateScreening?> GetHardGateScreeningByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.ApplicationRecords
            .Where(r => r.Id == id)
            .Select(r => new ApplicationHardGateScreening
            {
                HardGatePassed = r.HardGatePassed,
                HardGateReason = r.HardGateReason
            })
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<HiringAgentEvaluation?> GetHardGateEvaluationByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.HiringAgentEvaluations
            .Where(e => e.ApplicationRecordId == id)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<ApplicationOwnership?> GetOwnershipAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.ApplicationRecords
            .Where(r => r.Id == id)
            .Select(r => new ApplicationOwnership
            {
                ClaimedByRecruiterId = r.ClaimedByRecruiterId,
                ClaimedAt = r.ClaimedAt,
                ShortlistedByRecruiterId = r.ShortlistedByRecruiterId,
                ShortlistedAt = r.ShortlistedAt,
                RecruiterRating = r.RecruiterRating,
                RecruiterRatingNote = r.RecruiterRatingNote,
                RatedByRecruiterId = r.RatedByRecruiterId,
                RatedAt = r.RatedAt
            })
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
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
        var previousStatus = applicationRecord.Status;
        applicationRecord.ClaimedByRecruiterId = recruiterIdentity;
        applicationRecord.ClaimedAt = now;
        applicationRecord.Status = "PENDING";
        applicationRecord.UpdatedAt = now;

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "CLAIM",
            PreviousStatus = previousStatus,
            NewStatus = "PENDING",
            ActionedAt = now
        }, cancellationToken);

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

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "RATING",
            RatingValue = rating,
            Reason = notes,
            ActionedAt = now
        }, cancellationToken);

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

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "RATING",
            RatingValue = applicationRecord.RecruiterRating,
            Reason = notes,
            ActionedAt = now
        }, cancellationToken);

        return new ApplicationRatingUpdate
        {
            RatedByRecruiterId = applicationRecord.RatedByRecruiterId ?? string.Empty,
            RatedAt = applicationRecord.RatedAt ?? now,
            RecruiterRating = applicationRecord.RecruiterRating,
            RecruiterRatingNote = notes
        };
    }

    public async Task<List<RecruiterActionLogDto>> GetRecruiterLogsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.RecruiterActions
            .AsNoTracking()
            .Where(a => a.ApplicationRecordId == id)
            .OrderByDescending(a => a.ActionedAt)
            .Select(a => new RecruiterActionLogDto
            {
                Id = a.Id,
                ApplicationRecordId = a.ApplicationRecordId,
                RecruiterIdentity = a.RecruiterIdentity,
                ActionType = a.ActionType,
                PreviousStatus = a.PreviousStatus,
                NewStatus = a.NewStatus,
                Reason = a.Reason,
                RatingValue = a.RatingValue,
                ActionedAt = a.ActionedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<RecruiterActionLogDto>> GetAllRecruiterLogsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.RecruiterActions
            .AsNoTracking()
            .OrderByDescending(a => a.ActionedAt)
            .Select(a => new RecruiterActionLogDto
            {
                Id = a.Id,
                ApplicationRecordId = a.ApplicationRecordId,
                RecruiterIdentity = a.RecruiterIdentity,
                ActionType = a.ActionType,
                PreviousStatus = a.PreviousStatus,
                NewStatus = a.NewStatus,
                Reason = a.Reason,
                RatingValue = a.RatingValue,
                ActionedAt = a.ActionedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<DashboardApplicationDto>> GetDashboardApplicationsAsync(
        GetDashboardApplicationsQuery query,
        CancellationToken cancellationToken = default)
    {
        var records = _dbContext.ApplicationRecords.AsNoTracking();

        if (query.Status is not null)
        {
            records = records.Where(a => a.Status == query.Status);
        }

        if (query.Tier is not null)
        {
            records = records.Where(a => a.Tier == query.Tier);
        }

        if (query.HardGatePassed is not null)
        {
            records = records.Where(a => a.HardGatePassed == query.HardGatePassed);
        }

        if (query.IsClaimed is not null)
        {
            records = query.IsClaimed.Value
                ? records.Where(a => a.ClaimedByRecruiterId != null)
                : records.Where(a => a.ClaimedByRecruiterId == null);
        }

        if (query.IsShortlisted is not null)
        {
            records = query.IsShortlisted.Value
                ? records.Where(a => a.ShortlistedByRecruiterId != null)
                : records.Where(a => a.ShortlistedByRecruiterId == null);
        }

        if (!string.IsNullOrWhiteSpace(query.RecruiterIdentity))
        {
            records = records.Where(a =>
                a.ClaimedByRecruiterId == query.RecruiterIdentity ||
                a.ShortlistedByRecruiterId == query.RecruiterIdentity ||
                a.RatedByRecruiterId == query.RecruiterIdentity);
        }

        if (query.FromDate is not null)
        {
            var fromDate = new DateTimeOffset(DateTime.SpecifyKind(query.FromDate.Value, DateTimeKind.Utc));
            records = records.Where(a => a.CreatedAt >= fromDate);
        }

        if (query.ToDate is not null)
        {
            var toDate = new DateTimeOffset(DateTime.SpecifyKind(query.ToDate.Value, DateTimeKind.Utc));
            records = records.Where(a => a.CreatedAt <= toDate);
        }

        var dashboardRecords = await records
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.CandidateName,
                a.Status,
                a.Tier,
                a.HardGatePassed,
                a.HiringAgentTotalScore,
                a.CvSummary,
                a.FlagsJson,
                a.CandidateGitHubUrl,
                a.ClaimedByRecruiterId,
                a.ShortlistedByRecruiterId,
                a.RatedByRecruiterId,
                a.RecruiterRating,
                a.CreatedAt,
                LatestEvaluation = a.HiringAgentEvaluations
                    .OrderByDescending(e => e.ProcessedAt)
                    .Select(e => new { e.InstitutionJson, e.CategoryScoresJson })
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return dashboardRecords
            .Select(a => new DashboardApplicationDto
            {
                ApplicationId = a.Id.ToString(),
                CandidateName = a.CandidateName ?? string.Empty,
                CurrentStatus = a.Status,
                Tier = a.Tier ?? string.Empty,
                HardGatePassed = a.HardGatePassed ?? false,
                HiringAgentTotalScore = (double)(a.HiringAgentTotalScore ?? 0),
                CvSummary = a.CvSummary ?? string.Empty,
                Flags = ReadFlags(a.FlagsJson),
                CandidateGitHubUrl = a.CandidateGitHubUrl,
                ClaimedByRecruiterId = a.ClaimedByRecruiterId,
                ShortlistedByRecruiterId = a.ShortlistedByRecruiterId,
                RatedByRecruiterId = a.RatedByRecruiterId,
                RecruiterRating = a.RecruiterRating,
                AcademicAverage = GetAcademicAverage(a.LatestEvaluation?.InstitutionJson, a.LatestEvaluation?.CategoryScoresJson),
                CreatedAt = a.CreatedAt.UtcDateTime
            })
            .ToList();
    }

    private static double? GetAcademicAverage(JsonDocument? instJson, JsonDocument? scoreJson)
    {
        if (instJson != null)
        {
            try
            {
                var root = instJson.RootElement;
                if (root.TryGetProperty("academic_average", out var avgProp) && avgProp.TryGetDouble(out var val))
                {
                    return val;
                }
                if (root.TryGetProperty("academicAverage", out var avgPropCamel) && avgPropCamel.TryGetDouble(out var valCamel))
                {
                    return valCamel;
                }
            }
            catch { }
        }

        if (scoreJson != null)
        {
            try
            {
                var root = scoreJson.RootElement;
                if (root.TryGetProperty("education", out var eduProp) && 
                    eduProp.TryGetProperty("score", out var scoreProp) && 
                    scoreProp.TryGetDouble(out var val))
                {
                    return val;
                }
            }
            catch { }
        }

        return null;
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

    private static List<string> ReadFlags(JsonDocument? flagsJson)
    {
        if (flagsJson is null || flagsJson.RootElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return flagsJson.RootElement
            .EnumerateArray()
            .Where(flag => flag.ValueKind == JsonValueKind.String)
            .Select(flag => flag.GetString()!)
            .ToList();
    }
}
