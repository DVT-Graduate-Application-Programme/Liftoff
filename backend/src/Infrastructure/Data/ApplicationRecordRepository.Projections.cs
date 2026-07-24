using Application.Queries.GetDashboardApplications;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public partial class ApplicationRecordRepository
{
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
                UpdatedAt = r.UpdatedAt,
                HiringAgentEvaluations = r.HiringAgentEvaluations.ToList(),
                RecruiterActions = r.RecruiterActions.ToList(),
                AuditLogs = r.AuditLogs.ToList()
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

    public Task<List<Recruiter>> GetRecruitersAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.Recruiters
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task AddRecruiterAsync(RecruiterPostDto recruiter, CancellationToken cancellationToken = default)
    {
        var recruiterEntity = new Recruiter
        {
            FirstName = recruiter.FirstName,
            LastName = recruiter.LastName,
            Email = recruiter.Email,
            IdentityId = recruiter.Email
        };

        return _dbContext.Recruiters.AddAsync(recruiterEntity, cancellationToken).AsTask();
    }
}
