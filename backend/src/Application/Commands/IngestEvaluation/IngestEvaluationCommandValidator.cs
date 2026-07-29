using System;
using FluentValidation;

namespace Application.Commands.IngestEvaluation;

public class IngestEvaluationCommandValidator : AbstractValidator<IngestEvaluationCommand>
{
    public IngestEvaluationCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty().WithMessage("ApplicationId is required.")
            .Must(BeAValidGuid).WithMessage("ApplicationId must be a valid GUID.");
    }

    private static bool BeAValidGuid(string id)
    {
        return Guid.TryParse(id, out _);
    }
}
