using Application.Interfaces;
using Domain.Entities;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Services;

/// <summary>
/// Assigns the next recruiter (round-robin by fewest applications) to a newly
/// ingested application and records a CLAIM action in the audit trail.
/// </summary>
public class RecruiterAssignmentService : IRecruiterAssignmentService
{
    private readonly IRecruiterRepository _recruiterRepository;
    private readonly IApplicationRecordRepository _applicationRepository;
    private readonly IApplicationOwnershipService _ownershipService;
    private readonly ILogger<RecruiterAssignmentService> _logger;

    public RecruiterAssignmentService(
        IRecruiterRepository recruiterRepository,
        IApplicationRecordRepository applicationRepository,
        IApplicationOwnershipService ownershipService,
        ILogger<RecruiterAssignmentService> logger)
    {
        _recruiterRepository = recruiterRepository;
        _applicationRepository = applicationRepository;
        _ownershipService = ownershipService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<Recruiter?> AssignRecruiterAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        var recruiter = await _recruiterRepository.GetRecruiters(cancellationToken);

        if (recruiter is null)
        {
            _logger.LogWarning(
                "No recruiters found in the system. Application {ApplicationId} will remain unassigned.",
                applicationId);
            return null;
        }

        var application = await _applicationRepository.GetByIdAsync(applicationId, cancellationToken);

        if (application is null)
        {
            _logger.LogError(
                "Cannot assign recruiter: Application {ApplicationId} not found.",
                applicationId);
            return null;
        }

        // Skip if already assigned (idempotency guard)
        if (!string.IsNullOrWhiteSpace(application.ClaimedByRecruiterId))
        {
            _logger.LogInformation(
                "Application {ApplicationId} is already assigned to recruiter {RecruiterId}. Skipping.",
                applicationId,
                application.ClaimedByRecruiterId);
            return recruiter;
        }

        // Perform the claim through the existing repository method
        var claim = await _ownershipService.ClaimOwnershipAsync(
            applicationId,
            recruiter.IdentityId,
            cancellationToken);

        if (claim is null)
        {
            _logger.LogError(
                "ClaimOwnership returned null for Application {ApplicationId}. Assignment failed.",
                applicationId);
            return null;
        }

        await _applicationRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Application {ApplicationId} auto-assigned to recruiter {RecruiterName} ({RecruiterId}) via round-robin.",
            applicationId,
            recruiter.FullName,
            recruiter.IdentityId);

        return recruiter;
    }
}
