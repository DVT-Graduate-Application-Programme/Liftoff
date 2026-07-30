using Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public interface IApplicationOwnershipService
{
    Task<ApplicationOwnershipClaim?> ClaimOwnershipAsync(Guid id, string recruiterIdentity, CancellationToken cancellationToken = default);
    Task<ApplicationOwnershipShortlist?> ShortlistAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationStatusUpdate?> AcceptAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationStatusUpdate?> RejectAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationRatingUpdate?> RateAsync(Guid id, string recruiterIdentity, short rating, string? notes, CancellationToken cancellationToken = default);
    Task<ApplicationRatingUpdate?> AddNotesAsync(Guid id, string recruiterIdentity, string notes, CancellationToken cancellationToken = default);
}
