using Application.Interfaces;
using Domain.Entities;
using MediatR;
using System.Text.Json;

namespace Application.Features.IngestTranscript;

public class IngestTranscriptResult
{
    public bool Accepted { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class IngestTranscriptHandler
    : IRequestHandler<IngestTranscriptCommand, IngestTranscriptResult>
{
    private readonly IApplicationRecordRepository _repository;

    public IngestTranscriptHandler(IApplicationRecordRepository repository)
    {
        _repository = repository;
    }

    public async Task<IngestTranscriptResult> Handle(
        IngestTranscriptCommand request,
        CancellationToken cancellationToken)
    {
        await _repository.AddAuditLogAsync(new AuditLog
        {
            SourceService = "TranscriptIngestion",
            LogLevel = "Information",
            Message = JsonSerializer.Serialize(request),
            Timestamp = DateTimeOffset.UtcNow
        }, cancellationToken);

        await _repository.SaveChangesAsync(cancellationToken);

        return new IngestTranscriptResult
        {
            Accepted = true,
            Message = $"Transcript received for '{request.DegreeName}' and saved."
        };
    }
}
