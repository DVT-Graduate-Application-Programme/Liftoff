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

    public async Task<Recruiter?> GetRecruiters(CancellationToken cancellationToken = default)
    {
        var activeRecruiters = await _dbContext.Recruiters
            .AsNoTracking()
            .Where(r => r.IsActive)
            .ToListAsync(cancellationToken);

        if (activeRecruiters.Count == 0)
            return null;

        var lastAssignedRecruiterIdentity = await _dbContext.ApplicationRecords
            .AsNoTracking()
            .Where(a => a.ClaimedByRecruiterId != null)
            .OrderByDescending(a => a.ClaimedAt ?? a.UpdatedAt)
            .Select(a => a.ClaimedByRecruiterId!)
            .FirstOrDefaultAsync(cancellationToken);

        return SelectNextRecruiterForRoundRobin(activeRecruiters, lastAssignedRecruiterIdentity);
    }

    public static Recruiter? SelectNextRecruiterForRoundRobin(IReadOnlyList<Recruiter> recruiters, string? lastAssignedRecruiterIdentity)
    {
        if (recruiters.Count == 0)
            return null;

        var orderedRecruiters = recruiters
            .Where(r => r.IsActive)
            .OrderBy(r => r.CreatedAt)
            .ThenBy(r => r.IdentityId)
            .ToList();

        if (orderedRecruiters.Count == 0)
            return null;

        if (string.IsNullOrWhiteSpace(lastAssignedRecruiterIdentity))
            return orderedRecruiters[0];

        var currentIndex = orderedRecruiters.FindIndex(r =>
            string.Equals(r.IdentityId, lastAssignedRecruiterIdentity, StringComparison.OrdinalIgnoreCase));

        if (currentIndex < 0)
            return orderedRecruiters[0];

        var nextIndex = (currentIndex + 1) % orderedRecruiters.Count;
        return orderedRecruiters[nextIndex];
    }
}
