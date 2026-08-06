using Application.Interfaces;

using Domain.Entities;

namespace Application.Services;

public class RecruiterAssignmentPolicy
{
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IApplicationRecordRepository _applicationRepository;

    public RecruiterAssignmentPolicy(
        IRecruiterRepository recruiterRepository,
        IApplicationRecordRepository applicationRepository)
    {
        _recruiterRepository = recruiterRepository;
        _applicationRepository = applicationRepository;
    }

    public async Task<Recruiter?> SelectNextRecruiterAsync(CancellationToken cancellationToken = default)
    {
        var activeRecruiters = await _recruiterRepository.GetActiveRecruiters(cancellationToken);

        if (activeRecruiters.Count == 0)
            return null;

        var lastAssignedRecruiterIdentity = await _applicationRepository
            .GetLastAssignedRecruiterIdentityAsync(cancellationToken);

        return SelectNextRecruiterForRoundRobin(activeRecruiters, lastAssignedRecruiterIdentity);
    }

    // Lifted directly from the repository — logic is unchanged, just moved
    public static Recruiter? SelectNextRecruiterForRoundRobin(
        IReadOnlyList<Recruiter> recruiters, 
        string? lastAssignedRecruiterIdentity)
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
