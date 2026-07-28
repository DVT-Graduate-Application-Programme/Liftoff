using System.IO;
using Application.Interfaces;
using Domain.Entities;
using Domain.Messaging;
using MediatR;

namespace Application.Features.SendApplicaton;

public class SendApplicationHandler
    : IRequestHandler<SendApplicationCommand, SendApplicationResult>
{
    private readonly IApplicationRecordRepository _repository;
    private readonly IApplicationQueuePublisher _queuePublisher;

    public SendApplicationHandler(
        IApplicationRecordRepository repository,
        IApplicationQueuePublisher queuePublisher)
    {
        _repository = repository;
        _queuePublisher = queuePublisher;
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
            CvAttachmentId = null,
            TranscriptAttachmentId = null,
            Status = "PROCESSING",
            CreatedAt = now,
            UpdatedAt = now
        };

        var possiblePaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Data", "SeedDocuments"),
            Path.Combine(Directory.GetCurrentDirectory(), "src", "Infrastructure", "Data", "SeedDocuments"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "Infrastructure", "Data", "SeedDocuments")
        };
        string folder = possiblePaths.FirstOrDefault(Directory.Exists) ?? possiblePaths[0];
        Directory.CreateDirectory(folder);

        var cvFilePath = Path.Combine(folder, $"{applicationRecord.Id}_cv.pdf");
        using (var fileStream = new FileStream(cvFilePath, FileMode.Create))
        {
            await request.CvStream.CopyToAsync(fileStream, cancellationToken);
        }

        if (request.TranscriptStream != null)
        {
            var transcriptFilePath = Path.Combine(folder, $"{applicationRecord.Id}_transcript.pdf");
            using (var fileStream = new FileStream(transcriptFilePath, FileMode.Create))
            {
                await request.TranscriptStream.CopyToAsync(fileStream, cancellationToken);
            }
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
