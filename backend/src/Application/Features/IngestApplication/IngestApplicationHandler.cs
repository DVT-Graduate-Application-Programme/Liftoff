using Application.Ai;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Messaging;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.IngestApplication;

public class IngestApplicationHandler : IRequestHandler<IngestApplicationRequest, bool>
{
    private readonly IGraphEmailService _graphEmailService;
    private readonly IAttachmentClassificationService _classificationService;
    private readonly IApplicationRecordRepository _repository;
    private readonly IRecruiterAssignmentService _recruiterAssignmentService;
    private readonly IApplicationQueuePublisher _queuePublisher;
    private readonly IDocumentStorage _documentStorage;
    private readonly ILogger<IngestApplicationHandler> _logger;

    public IngestApplicationHandler(
        IGraphEmailService graphEmailService,
        IAttachmentClassificationService classificationService,
        IApplicationRecordRepository repository,
        IRecruiterAssignmentService recruiterAssignmentService,
        IApplicationQueuePublisher queuePublisher,
        IDocumentStorage documentStorage,
        ILogger<IngestApplicationHandler> logger)
    {
        _graphEmailService = graphEmailService;
        _classificationService = classificationService;
        _repository = repository;
        _recruiterAssignmentService = recruiterAssignmentService;
        _queuePublisher = queuePublisher;
        _documentStorage = documentStorage;
        _logger = logger;
    }

    public async Task<bool> Handle(IngestApplicationRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.MessageId))
        {
            throw new ArgumentException("MessageId is required to ingest an application.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.From))
        {
            throw new ArgumentException("Sender email is required to ingest an application.", nameof(request));
        }

        // Guard: skip if already processed (idempotency)
        if (await _repository.ExistsAsync(request.MessageId, cancellationToken))
        {
            _logger.LogInformation("Message {MessageId} already ingested, skipping.", request.MessageId);
            return true;
        }

        var now = DateTimeOffset.UtcNow;
        var applicationRecord = ApplicationRecord.Create(
            emailMessageId: request.MessageId,
            candidateEmail: request.From,
            status: ApplicationStatus.PENDING.ToString(),
            timestamp: now);

        // 1. Fetch attachments from Microsoft Graph
        var attachments = await _graphEmailService.GetAttachmentsAsync(request.UserId, request.MessageId, cancellationToken);

        // 2. Classify each attachment and assign IDs
        foreach (var attachment in attachments)
        {
            var classification = await _classificationService.ClassifyAttachmentAsync(
                attachment.ContentBytes,
                attachment.Name,
                attachment.ContentType,
                cancellationToken);

            _logger.LogInformation("Attachment '{Name}' classified as: {Classification}", attachment.Name, classification);

            if (classification == "CV")
            {
                var reference = await StoreAttachmentAsync(
                    DocumentKind.Cv,
                    applicationRecord.Id,
                    attachment,
                    cancellationToken);
                applicationRecord.SetCvAttachment(reference);
            }
            else if (classification == "Transcript")
            {
                var reference = await StoreAttachmentAsync(
                    DocumentKind.Transcript,
                    applicationRecord.Id,
                    attachment,
                    cancellationToken);
                applicationRecord.SetTranscriptAttachment(reference);
            }
        }

        // 3. Persist to database
        await _repository.AddAsync(applicationRecord, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "ApplicationRecord saved for MessageId {MessageId} with Id {ApplicationId}.",
            request.MessageId,
            applicationRecord.Id);

        // 4. Auto-assign a recruiter via round-robin
        await _recruiterAssignmentService.AssignRecruiterAsync(applicationRecord.Id, cancellationToken);

        // 5. Enqueue for asynchronous CV processing by the background worker
        await _queuePublisher.PublishAsync(new CvProcessingMessage(applicationRecord.Id), cancellationToken);

        return true;
    }

    private async Task<string> StoreAttachmentAsync(
        DocumentKind kind,
        Guid applicationId,
        EmailAttachmentDto attachment,
        CancellationToken cancellationToken)
    {
        using var content = new MemoryStream(attachment.ContentBytes, writable: false);

        return await _documentStorage.SaveAsync(
            kind,
            applicationId,
            content,
            attachment.ContentType,
            cancellationToken);
    }
}