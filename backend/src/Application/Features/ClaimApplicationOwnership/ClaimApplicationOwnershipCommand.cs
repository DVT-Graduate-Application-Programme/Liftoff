using Application.Interfaces;
using Domain.Entities;
using FluentValidation;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.ClaimApplicationOwnership;

public record ClaimApplicationOwnershipCommand(Guid ApplicationId, string RecruiterIdentity) : IRequest<ApplicationOwnershipClaim?>;

public class ClaimApplicationOwnershipCommandValidator : AbstractValidator<ClaimApplicationOwnershipCommand>
{
    public ClaimApplicationOwnershipCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.RecruiterIdentity).NotEmpty().WithMessage("RecruiterIdentity is required.");
    }
}

public class ClaimApplicationOwnershipHandler : IRequestHandler<ClaimApplicationOwnershipCommand, ApplicationOwnershipClaim?>
{
    private readonly IApplicationOwnershipService _ownershipService;
    private readonly IApplicationRecordRepository _repository;

    public ClaimApplicationOwnershipHandler(
        IApplicationOwnershipService ownershipService,
        IApplicationRecordRepository repository)
    {
        _ownershipService = ownershipService;
        _repository = repository;
    }

    public async Task<ApplicationOwnershipClaim?> Handle(ClaimApplicationOwnershipCommand request, CancellationToken cancellationToken)
    {
        var claim = await _ownershipService.ClaimOwnershipAsync(request.ApplicationId, request.RecruiterIdentity, cancellationToken);
        if (claim is null) return null;

        await _repository.SaveChangesAsync(cancellationToken);
        return claim;
    }
}
