using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Data;

public class ApplicationQueryService : IApplicationQueryService
{
    private readonly GradRecruitmentDbContext _dbContext;

    public ApplicationQueryService(GradRecruitmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ApplicationDetails?> GetApplicationDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var record = await _dbContext.ApplicationRecords
            .Where(r => r.Id == id)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.Tier,
                r.CreatedAt,
                r.UpdatedAt,
                HiringAgentEvaluations = r.HiringAgentEvaluations.ToList(),
                RecruiterActions = r.RecruiterActions.ToList(),
                AuditLogs = r.AuditLogs.ToList()
            })
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (record is null)
        {
            return null;
        }

        return new ApplicationDetails
        {
            Id = record.Id,
            Status = record.Status,
            Tier = record.Tier,
            CreatedAt = record.CreatedAt,
            UpdatedAt = record.UpdatedAt,
            // Mapped after materialisation rather than inside the projection: ToDto parses
            // the jsonb text with JsonDocument, which EF cannot translate to SQL.
            HiringAgentEvaluations = record.HiringAgentEvaluations.Select(e => e.ToDto()).ToList(),
            RecruiterActions = record.RecruiterActions,
            AuditLogs = record.AuditLogs
        };
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
}
