using Application.Ai;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Ingestion;

public class IngestApplicationHandler : IRequestHandler<IngestApplicationRequest, bool>
{
    private readonly IGraphEmailService _graphEmailService;
    private readonly IAttachmentClassificationService _classificationService;

    public IngestApplicationHandler(
        IGraphEmailService graphEmailService,
        IAttachmentClassificationService classificationService)
    {
        _graphEmailService = graphEmailService;
        _classificationService = classificationService;
    }

    public async Task<bool> Handle(IngestApplicationRequest request, CancellationToken cancellationToken)
    {
        var applicationRecord = new ApplicationRecord
        {
            EmailMessageId = request.MessageId,
            CandidateEmail = request.From,
            Status = "New"
        };

        // 1. Fetch attachments from Microsoft Graph
        var attachments = await _graphEmailService.GetAttachmentsAsync(request.UserId, request.MessageId, cancellationToken);

        // 2. Classify each attachment
        foreach (var attachment in attachments)
        {
            var classification = await _classificationService.ClassifyAttachmentAsync(
                attachment.ContentBytes, 
                attachment.Name, 
                attachment.ContentType, 
                cancellationToken);

            if (classification == "CV")
            {
                applicationRecord.CvAttachmentId = attachment.Id;
            }
            else if (classification == "Transcript")
            {
                applicationRecord.TranscriptAttachmentId = attachment.Id;
            }
        }

        // TODO: Save applicationRecord to DbContext
        // await _dbContext.ApplicationRecords.AddAsync(applicationRecord, cancellationToken);
        // await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}