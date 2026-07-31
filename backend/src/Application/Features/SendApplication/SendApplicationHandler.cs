using Application.Interfaces;

using Domain.Entities;
using Domain.Enums;
using Domain.Messaging;

using MediatR;

using Backend.Application.Interfaces;

namespace Application.Features.SendApplication;

public class SendApplicationHandler
    : IRequestHandler<SendApplicationCommand, SendApplicationResult>
{
    private readonly IApplicationRecordRepository _repository;
    private readonly IApplicationQueuePublisher _queuePublisher;
    private readonly ICvStorage _cvStorage;

    public SendApplicationHandler(
        IApplicationRecordRepository repository,
        IApplicationQueuePublisher queuePublisher,
        ICvStorage cvStorage)
    {
        _repository = repository;
        _queuePublisher = queuePublisher;
        _cvStorage = cvStorage;
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
        var applicationRecord = ApplicationRecord.Create(
            emailMessageId: emailMessageId,
            candidateName: request.CandidateName,
            candidateEmail: request.CandidateEmail,
            status: ApplicationStatus.PROCESSING.ToString(),
            timestamp: now);

        var cvPath = await _cvStorage.SaveFileAsync(
            request.CvStream,
            $"{applicationRecord.Id}_cv.pdf",
            cancellationToken);
            
        applicationRecord.SetCvAttachment(cvPath);

        if (request.TranscriptStream != null)
        {
            var transcriptPath = await _cvStorage.SaveFileAsync(
                request.TranscriptStream,
                $"{applicationRecord.Id}_transcript.pdf",
                cancellationToken);
            applicationRecord.SetTranscriptAttachment(transcriptPath);
        }

        await _repository.AddAsync(applicationRecord, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        // Enqueue for asynchronous CV processing by the background worker
        await _queuePublisher.PublishAsync(new CvProcessingMessage(applicationRecord.Id), cancellationToken);

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
