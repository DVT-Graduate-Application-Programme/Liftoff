using Application.Interfaces;
using Domain.Entities;
using FluentValidation;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Commands.RejectApplication;

public record RejectApplicationCommand(Guid ApplicationId, string RecruiterIdentity, string? Reason) : IRequest<ApplicationStatusUpdate?>;

public class RejectApplicationCommandValidator : AbstractValidator<RejectApplicationCommand>
{
    public RejectApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.RecruiterIdentity).NotEmpty().WithMessage("RecruiterIdentity is required.");
    }
}

public class RejectApplicationHandler : IRequestHandler<RejectApplicationCommand, ApplicationStatusUpdate?>
{
    private readonly IApplicationOwnershipService _ownershipService;
    private readonly IApplicationRecordRepository _repository;

    public RejectApplicationHandler(
        IApplicationOwnershipService ownershipService,
        IApplicationRecordRepository repository)
    {
        _ownershipService = ownershipService;
        _repository = repository;
    }

    public async Task<ApplicationStatusUpdate?> Handle(RejectApplicationCommand request, CancellationToken cancellationToken)
    {
        var result = await _ownershipService.RejectAsync(request.ApplicationId, request.RecruiterIdentity, request.Reason, cancellationToken);
        if (result is null) return null;

        await _repository.SaveChangesAsync(cancellationToken);
        return result;
    }
}
