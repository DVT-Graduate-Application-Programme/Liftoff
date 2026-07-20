using Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public interface IRecruiterAssignmentService
{
    Task<Recruiter?> AssignRecruiterAsync(Guid applicationId, CancellationToken cancellationToken = default);
}
