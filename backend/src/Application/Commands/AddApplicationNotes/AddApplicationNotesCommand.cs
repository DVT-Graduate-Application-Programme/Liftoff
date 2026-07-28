using Application.Interfaces;
using Domain.Entities;
using FluentValidation;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Commands.AddApplicationNotes;

public record AddApplicationNotesCommand(Guid ApplicationId, string RecruiterIdentity, string Notes) : IRequest<ApplicationRatingUpdate?>;

public class AddApplicationNotesCommandValidator : AbstractValidator<AddApplicationNotesCommand>
{
    public AddApplicationNotesCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.RecruiterIdentity).NotEmpty().WithMessage("RecruiterIdentity is required.");
        RuleFor(x => x.Notes).NotEmpty().WithMessage("Notes are required.");
    }
}

public class AddApplicationNotesHandler : IRequestHandler<AddApplicationNotesCommand, ApplicationRatingUpdate?>
{
    private readonly IApplicationOwnershipService _ownershipService;
    private readonly IApplicationRecordRepository _repository;

    public AddApplicationNotesHandler(
        IApplicationOwnershipService ownershipService,
        IApplicationRecordRepository repository)
    {
        _ownershipService = ownershipService;
        _repository = repository;
    }

    public async Task<ApplicationRatingUpdate?> Handle(AddApplicationNotesCommand request, CancellationToken cancellationToken)
    {
        var result = await _ownershipService.AddNotesAsync(request.ApplicationId, request.RecruiterIdentity, request.Notes, cancellationToken);
        if (result is null) return null;

        await _repository.SaveChangesAsync(cancellationToken);
        return result;
    }
}
