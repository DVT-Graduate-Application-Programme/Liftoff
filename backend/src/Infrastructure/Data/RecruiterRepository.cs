using Application.Interfaces;

using Domain.Entities;

using Microsoft.EntityFrameworkCore;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Data;

public class RecruiterRepository : IRecruiterRepository
{
    private readonly GradRecruitmentDbContext _dbContext;

    public RecruiterRepository(GradRecruitmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Recruiter>> GetActiveRecruiters(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Recruiters
            .AsNoTracking()
            .Where(r => r.IsActive)
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

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
