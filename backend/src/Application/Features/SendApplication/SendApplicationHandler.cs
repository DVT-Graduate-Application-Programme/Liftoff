using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Messaging;
using MediatR;

namespace Application.Features.SendApplication;

public class SendApplicationHandler
    : IRequestHandler<SendApplicationCommand, SendApplicationResult>
{
    private readonly IApplicationRecordRepository _repository;
    private readonly IApplicationQueuePublisher _queuePublisher;
    private readonly IDocumentStorage _documentStorage;

    public SendApplicationHandler(
        IApplicationRecordRepository repository,
        IApplicationQueuePublisher queuePublisher,
        IDocumentStorage documentStorage)
    {
        _repository = repository;
        _queuePublisher = queuePublisher;
        _documentStorage = documentStorage;
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

        if (request.CvStream is null)
        {
            throw new ArgumentException("CvStream is required to ingest an application.", nameof(request));
        }

        var emailMessageId = BuildEmailMessageId(request);
        var existingRecord = await _repository.GetByEmailMessageIdAsync(emailMessageId, cancellationToken);

        if (existingRecord is null)
        {
            existingRecord = await _repository.GetByCandidateEmailAsync(request.CandidateEmail, cancellationToken);
        }

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

        var cvReference = await _documentStorage.SaveAsync(
            DocumentKind.Cv,
            applicationRecord.Id,
            request.CvStream,
            "application/pdf",
            cancellationToken);
        applicationRecord.SetCvAttachment(cvReference);

        if (request.TranscriptStream != null)
        {
            var transcriptReference = await _documentStorage.SaveAsync(
                DocumentKind.Transcript,
                applicationRecord.Id,
                request.TranscriptStream,
                "application/pdf",
                cancellationToken);
            applicationRecord.SetTranscriptAttachment(transcriptReference);
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
