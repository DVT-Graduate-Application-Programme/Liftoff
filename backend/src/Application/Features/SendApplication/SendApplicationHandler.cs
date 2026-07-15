using Application.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Features.SendApplicaton;

public class SendApplicationHandler
    : IRequestHandler<SendApplicationCommand, SendApplicationResult>
{
    private readonly IApplicationRecordRepository _repository;

    public SendApplicationHandler(IApplicationRecordRepository repository)
    {
        _repository = repository;
    }

    public async Task<SendApplicationResult> Handle(
        SendApplicationCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CandidateName))
        {
            throw new ArgumentException("CandidateName is required to ingest an application.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.CandidateEmail))
        {
            throw new ArgumentException("CandidateEmail is required to ingest an application.", nameof(request));
        }

        var emailMessageId = BuildEmailMessageId(request);
        var existingRecord = await _repository.GetByEmailMessageIdAsync(emailMessageId, cancellationToken);
        if (existingRecord is not null)
        {
            return new SendApplicationResult
            {
                ApplicationId = existingRecord.Id,
                Status = existingRecord.Status
            };
        }

        var now = DateTimeOffset.UtcNow;
        var applicationRecord = new ApplicationRecord
        {
            EmailMessageId = emailMessageId,
            CandidateName = request.CandidateName,
            CandidateEmail = request.CandidateEmail,
            CvAttachmentId = request.CVurl is not null ? request.CVurl : null,
            TranscriptAttachmentId = request.TranscriptUrl is not null ? request.TranscriptUrl : null,
            Status = "PENDING",
            CreatedAt = now,
            UpdatedAt = now
        };

        await _repository.AddAsync(applicationRecord, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new SendApplicationResult
        {
            ApplicationId = applicationRecord.Id,
            Status = applicationRecord.Status
        };
    }

    private static string BuildEmailMessageId(SendApplicationCommand request)
    {
        var idempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey)
            ? request.CandidateEmail.Trim().ToLowerInvariant()
            : request.IdempotencyKey.Trim();

        return $"manual:{idempotencyKey}";
    }
}
