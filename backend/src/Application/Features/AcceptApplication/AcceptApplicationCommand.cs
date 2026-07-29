using Application.Interfaces;
using Domain.Entities;
using FluentValidation;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.AcceptApplication;

public record AcceptApplicationCommand(Guid ApplicationId, string RecruiterIdentity, string? Reason) : IRequest<ApplicationStatusUpdate?>;

public class AcceptApplicationCommandValidator : AbstractValidator<AcceptApplicationCommand>
{
    public AcceptApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.RecruiterIdentity).NotEmpty().WithMessage("RecruiterIdentity is required.");
    }
}

public class AcceptApplicationHandler : IRequestHandler<AcceptApplicationCommand, ApplicationStatusUpdate?>
{
    private readonly IApplicationOwnershipService _ownershipService;
    private readonly IApplicationRecordRepository _repository;

    public AcceptApplicationHandler(
        IApplicationOwnershipService ownershipService,
        IApplicationRecordRepository repository)
    {
        _ownershipService = ownershipService;
        _repository = repository;
    }

    public async Task<ApplicationStatusUpdate?> Handle(AcceptApplicationCommand request, CancellationToken cancellationToken)
    {
        var result = await _ownershipService.AcceptAsync(request.ApplicationId, request.RecruiterIdentity, request.Reason, cancellationToken);
        if (result is null) return null;

        await _repository.SaveChangesAsync(cancellationToken);
        return result;
    }
}
