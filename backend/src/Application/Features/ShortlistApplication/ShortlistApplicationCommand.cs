using Application.Interfaces;
using Domain.Entities;
using FluentValidation;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Commands.ShortlistApplication;

public record ShortlistApplicationCommand(Guid ApplicationId, string RecruiterIdentity, string? Reason) : IRequest<ApplicationOwnershipShortlist?>;

public class ShortlistApplicationCommandValidator : AbstractValidator<ShortlistApplicationCommand>
{
    public ShortlistApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.RecruiterIdentity).NotEmpty().WithMessage("RecruiterIdentity is required.");
    }
}

public class ShortlistApplicationHandler : IRequestHandler<ShortlistApplicationCommand, ApplicationOwnershipShortlist?>
{
    private readonly IApplicationOwnershipService _ownershipService;
    private readonly IApplicationRecordRepository _repository;

    public ShortlistApplicationHandler(
        IApplicationOwnershipService ownershipService,
        IApplicationRecordRepository repository)
    {
        _ownershipService = ownershipService;
        _repository = repository;
    }

    public async Task<ApplicationOwnershipShortlist?> Handle(ShortlistApplicationCommand request, CancellationToken cancellationToken)
    {
        var shortlist = await _ownershipService.ShortlistAsync(request.ApplicationId, request.RecruiterIdentity, request.Reason, cancellationToken);
        if (shortlist is null) return null;

        await _repository.SaveChangesAsync(cancellationToken);
        return shortlist;
    }
}
