using Application.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Features.Ingestion;

public class IngestManualApplicationHandler
    : IRequestHandler<IngestManualApplicationCommand, IngestManualApplicationResult>
{
    private readonly IApplicationRecordRepository _repository;

    public IngestManualApplicationHandler(IApplicationRecordRepository repository)
    {
        _repository = repository;
    }

    public async Task<IngestManualApplicationResult> Handle(
        IngestManualApplicationCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CandidateName))
        {
            throw new ArgumentException("CandidateName is required to ingest an application.", nameof(request.CandidateName));
        }

        if (string.IsNullOrWhiteSpace(request.CandidateEmail))
        {
            throw new ArgumentException("CandidateEmail is required to ingest an application.", nameof(request.CandidateEmail));
        }

        var emailMessageId = BuildEmailMessageId(request);
        var existingRecord = await _repository.GetByEmailMessageIdAsync(emailMessageId, cancellationToken);
        if (existingRecord is not null)
        {
            return new IngestManualApplicationResult
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
            CvAttachmentId = request.HasCvFile ? $"manual-cv:{Guid.NewGuid()}" : null,
            TranscriptAttachmentId = request.HasTranscriptFile ? $"manual-transcript:{Guid.NewGuid()}" : null,
            Status = ApplicationStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _repository.AddAsync(applicationRecord, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new IngestManualApplicationResult
        {
            ApplicationId = applicationRecord.Id,
            Status = applicationRecord.Status
        };
    }

    private static string BuildEmailMessageId(IngestManualApplicationCommand request)
    {
        var idempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey)
            ? request.CandidateEmail.Trim().ToLowerInvariant()
            : request.IdempotencyKey.Trim();

        return $"manual:{idempotencyKey}";
    }
}
