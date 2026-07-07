using Application.Ai;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Ingestion;

public class IngestApplicationHandler : IRequestHandler<IngestApplicationRequest, bool>
{
    private readonly IGraphEmailService _graphEmailService;
    private readonly IAttachmentClassificationService _classificationService;
    private readonly IApplicationRecordRepository _repository;
    private readonly ILogger<IngestApplicationHandler> _logger;

    public IngestApplicationHandler(
        IGraphEmailService graphEmailService,
        IAttachmentClassificationService classificationService,
        IApplicationRecordRepository repository,
        ILogger<IngestApplicationHandler> logger)
    {
        _graphEmailService = graphEmailService;
        _classificationService = classificationService;
        _repository = repository;
        _logger = logger;
    }

    public async Task<bool> Handle(IngestApplicationRequest request, CancellationToken cancellationToken)
    {
        // Guard: skip if already processed (idempotency)
        if (await _repository.ExistsAsync(request.MessageId, cancellationToken))
        {
            _logger.LogInformation("Message {MessageId} already ingested, skipping.", request.MessageId);
            return true;
        }

        var applicationRecord = new ApplicationRecord
        {
            EmailMessageId = request.MessageId,
            CandidateEmail = request.From,
            Status = "PENDING"
        };

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
                applicationRecord.CvAttachmentId = attachment.Id;
            }
            else if (classification == "Transcript")
            {
                applicationRecord.TranscriptAttachmentId = attachment.Id;
            }
        }

        // 3. Persist to database
        await _repository.AddAsync(applicationRecord, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ApplicationRecord saved for MessageId {MessageId}.", request.MessageId);

        return true;
    }
}