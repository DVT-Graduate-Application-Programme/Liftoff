using FluentValidation;

namespace Application.Features.IngestApplication;

public class IngestApplicationRequestValidator : AbstractValidator<IngestApplicationRequest>
{
    public IngestApplicationRequestValidator()
    {
        RuleFor(x => x.MessageId)
            .NotEmpty().WithMessage("MessageId is required to ingest an application.");

        RuleFor(x => x.From)
            .NotEmpty().WithMessage("Sender email is required to ingest an application.")
            .EmailAddress().WithMessage("Sender email must be a valid email address.");
    }
}
