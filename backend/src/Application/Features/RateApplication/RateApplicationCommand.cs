using Application.Interfaces;
using Domain.Entities;
using FluentValidation;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.RateApplication;

public record RateApplicationCommand(Guid ApplicationId, string RecruiterIdentity, short Rating, string? Notes) : IRequest<ApplicationRatingUpdate?>;

public class RateApplicationCommandValidator : AbstractValidator<RateApplicationCommand>
{
    public RateApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.RecruiterIdentity).NotEmpty().WithMessage("RecruiterIdentity is required.");
        RuleFor(x => x.Rating).InclusiveBetween((short)1, (short)5).WithMessage("Rating must be between 1 and 5.");
    }
}

public class RateApplicationHandler : IRequestHandler<RateApplicationCommand, ApplicationRatingUpdate?>
{
    private readonly IApplicationOwnershipService _ownershipService;
    private readonly IApplicationRecordRepository _repository;

    public RateApplicationHandler(
        IApplicationOwnershipService ownershipService,
        IApplicationRecordRepository repository)
    {
        _ownershipService = ownershipService;
        _repository = repository;
    }

    public async Task<ApplicationRatingUpdate?> Handle(RateApplicationCommand request, CancellationToken cancellationToken)
    {
        var result = await _ownershipService.RateAsync(request.ApplicationId, request.RecruiterIdentity, request.Rating, request.Notes, cancellationToken);
        if (result is null) return null;

        await _repository.SaveChangesAsync(cancellationToken);
        return result;
    }
}
