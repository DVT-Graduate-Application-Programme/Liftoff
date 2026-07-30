using System;
using FluentValidation;

namespace Application.Features.IngestEvaluation;

public class IngestEvaluationCommandValidator : AbstractValidator<IngestEvaluationCommand>
{
    public IngestEvaluationCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty().WithMessage("ApplicationId is required.")
            .Must(id => Guid.TryParse(id, out _)).WithMessage("ApplicationId must be a valid GUID.");
    }
}
