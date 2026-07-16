using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
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
        // Fetch ALL recruiters regardless of IsActive status
        var allRecruiters = await _dbContext.Recruiters
            .AsNoTracking()
            .OrderBy(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        if (allRecruiters.Count == 0)
            return null;

        // Count how many applications each recruiter has already been assigned
        var assignmentCounts = await _dbContext.ApplicationRecords
            .AsNoTracking()
            .Where(a => a.ClaimedByRecruiterId != null)
            .GroupBy(a => a.ClaimedByRecruiterId!)
            .Select(g => new { RecruiterId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RecruiterId, x => x.Count, cancellationToken);

        // Select the recruiter with the fewest assignments; break ties by earliest CreatedAt
        return allRecruiters
            .OrderBy(r => assignmentCounts.GetValueOrDefault(r.IdentityId, 0))
            .ThenBy(r => r.CreatedAt)
            .First();
    }
}
