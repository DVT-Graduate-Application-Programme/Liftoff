using Application.DTOs;
using Application.Interfaces;
using FluentValidation;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.RateTechnicalApplication;

public record RateTechnicalApplicationCommand(Guid ApplicationId, string RecruiterIdentity, short Rating) : IRequest<ApplicationTechnicalRatingDto?>;

public class RateTechnicalApplicationCommandValidator : AbstractValidator<RateTechnicalApplicationCommand>
{
    public RateTechnicalApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.RecruiterIdentity).NotEmpty().WithMessage("RecruiterIdentity is required.");
        RuleFor(x => x.Rating).InclusiveBetween((short)1, (short)5).WithMessage("Rating must be between 1 and 5.");
    }
}

public class RateTechnicalApplicationHandler : IRequestHandler<RateTechnicalApplicationCommand, ApplicationTechnicalRatingDto?>
{
    private readonly IApplicationOwnershipService _ownershipService;
    private readonly IApplicationRecordRepository _repository;

    public RateTechnicalApplicationHandler(
        IApplicationOwnershipService ownershipService,
        IApplicationRecordRepository repository)
    {
        _ownershipService = ownershipService;
        _repository = repository;
    }

    public async Task<ApplicationTechnicalRatingDto?> Handle(RateTechnicalApplicationCommand request, CancellationToken cancellationToken)
    {
        var result = await _ownershipService.RateTechnicalAsync(request.ApplicationId, request.RecruiterIdentity, request.Rating, cancellationToken);
        if (result is null) return null;

        await _repository.SaveChangesAsync(cancellationToken);
        return result;
    }
}
