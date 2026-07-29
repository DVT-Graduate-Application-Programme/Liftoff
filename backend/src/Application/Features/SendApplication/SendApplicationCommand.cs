using System.IO;
using MediatR;

namespace Application.Features.SendApplicaton;

public class SendApplicationCommand : IRequest<SendApplicationResult>
{
    
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string? IdempotencyKey { get; set; }
    public Stream CvStream { get; set; } = null!;
    public Stream? TranscriptStream { get; set; }
}


public class SendApplicationResult
{
    public Guid ApplicationId { get; set; }
    public string Status { get; set; } = string.Empty;
}
