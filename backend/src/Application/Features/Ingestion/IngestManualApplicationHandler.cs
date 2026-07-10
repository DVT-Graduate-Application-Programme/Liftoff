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
            throw new ArgumentException("CandidateName is required to ingest an application.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.CandidateEmail))
        {
            throw new ArgumentException("CandidateEmail is required to ingest an application.", nameof(request));
        }

        var now = DateTimeOffset.UtcNow;
        var applicationRecord = new ApplicationRecord
        {
            EmailMessageId = $"manual:{Guid.NewGuid()}",
            CandidateName = request.CandidateName,
            CandidateEmail = request.CandidateEmail,
            CvAttachmentId = request.HasCvFile ? $"manual-cv:{Guid.NewGuid()}" : null,
            TranscriptAttachmentId = request.HasTranscriptFile ? $"manual-transcript:{Guid.NewGuid()}" : null,
            Status = "PENDING",
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
}
