using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
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

    public async Task<bool> ExistsAsync(string emailMessageId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ApplicationRecords
            .AnyAsync(r => r.EmailMessageId == emailMessageId, cancellationToken);
    }

    public async Task AddAsync(ApplicationRecord record, CancellationToken cancellationToken = default)
    {
        await _dbContext.ApplicationRecords.AddAsync(record, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
