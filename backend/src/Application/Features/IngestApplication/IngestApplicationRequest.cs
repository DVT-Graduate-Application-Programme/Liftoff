using MediatR;

namespace Application.Features.IngestApplication;

public class IngestApplicationRequest : IRequest<bool>
{
    public string MessageId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty; // The email of the inbox
    public string From { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
}