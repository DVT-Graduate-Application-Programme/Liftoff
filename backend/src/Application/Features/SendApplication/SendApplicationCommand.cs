using MediatR;

namespace Application.Features.SendApplicaton;

public class SendApplicationCommand : IRequest<SendApplicationResult>
{
    
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string? IdempotencyKey { get; set; }
    public string CVurl { get; set; } = string.Empty;
    public string TranscriptUrl { get; set; } = string.Empty;
}


public class SendApplicationResult
{
    public Guid ApplicationId { get; set; }
    public string Status { get; set; } = string.Empty;
}
