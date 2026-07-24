using FluentValidation;

namespace Application.Features.SendApplicaton;

public class SendApplicationCommandValidator : AbstractValidator<SendApplicationCommand>
{
    public SendApplicationCommandValidator()
    {
        RuleFor(x => x.CandidateName)
            .NotEmpty().WithMessage("Candidate name is required.");

        RuleFor(x => x.CandidateEmail)
            .NotEmpty().WithMessage("Candidate email is required.")
            .EmailAddress().WithMessage("A valid candidate email address is required.");

        RuleFor(x => x.CvStream)
            .NotNull().WithMessage("CV file stream is required.");
    }
}
