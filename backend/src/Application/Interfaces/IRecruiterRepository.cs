using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public interface IRecruiterRepository
{
    Task<IReadOnlyList<Recruiter>> GetActiveRecruiters(CancellationToken cancellationToken = default);
    Task<List<Recruiter>> GetRecruitersAsync(CancellationToken cancellationToken = default);
    Task AddRecruiterAsync(RecruiterPostDto recruiter, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
