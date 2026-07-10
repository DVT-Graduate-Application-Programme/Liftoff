using MediatR;

namespace Application.Features.Ingestion;

public class IngestManualApplicationCommand : IRequest<IngestManualApplicationResult>
{
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public bool HasCvFile { get; set; }
    public bool HasTranscriptFile { get; set; }
}

public class IngestManualApplicationResult
{
    public Guid ApplicationId { get; set; }
    public string Status { get; set; } = string.Empty;
}
