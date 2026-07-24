using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

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
    public async Task AddAuditLogAsync(AuditLog auditLog, CancellationToken cancellationToken = default)
    {
        await _dbContext.AuditLogs.AddAsync(auditLog, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
