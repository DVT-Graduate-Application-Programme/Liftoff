using System.Threading;
using System.Threading.Tasks;

using Application.Interfaces;

using FluentValidation;

namespace Application.Features.SendApplication;

public class SendApplicationCommandValidator : AbstractValidator<SendApplicationCommand>
{
    private readonly IApplicationRecordRepository _repository;

    public SendApplicationCommandValidator(IApplicationRecordRepository repository)
    {
        _repository = repository;

        RuleFor(x => x.CandidateName)
            .NotEmpty().WithMessage("Candidate name is required.");

        RuleFor(x => x.CandidateEmail)
            .NotEmpty().WithMessage("Candidate email is required.")
            .EmailAddress().WithMessage("A valid candidate email address is required.")
            .MustAsync(BeUniqueCandidateEmail)
            .WithMessage("An application with this email already exists.");

        RuleFor(x => x.CvStream)
            .NotNull().WithMessage("CV file stream is required.");
    }

    private async Task<bool> BeUniqueCandidateEmail(SendApplicationCommand request, string candidateEmail, CancellationToken cancellationToken)
    {
        var emailMessageId = BuildEmailMessageId(candidateEmail, request.IdempotencyKey);
        var existingRecord = await _repository.GetByEmailMessageIdAsync(emailMessageId, cancellationToken);
        return existingRecord is null;
    }

    private static string BuildEmailMessageId(string candidateEmail, string? idempotencyKey)
    {
        var idempotencyKeyValue = string.IsNullOrWhiteSpace(idempotencyKey)
            ? candidateEmail.Trim().ToLowerInvariant()
            : idempotencyKey.Trim();

        return $"manual:{idempotencyKeyValue}";
    }
}