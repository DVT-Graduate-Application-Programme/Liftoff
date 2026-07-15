using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public class EmailAttachmentDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] ContentBytes { get; set; } = System.Array.Empty<byte>();
}

public class EmailMessageDto
{
    public string MessageId { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyPreview { get; set; } = string.Empty;
}

public interface IGraphEmailService
{
    Task<List<EmailAttachmentDto>> GetAttachmentsAsync(string userId, string messageId, CancellationToken cancellationToken = default);
    
    Task<EmailAttachmentDto?> GetAttachmentByIdAsync(string userId, string messageId, string attachmentId, CancellationToken cancellationToken = default);
    
    Task<List<EmailMessageDto>> GetUnreadMessagesAsync(string userId, int top = 10, CancellationToken cancellationToken = default);
    
    Task MarkMessageAsReadAsync(string userId, string messageId, CancellationToken cancellationToken = default);
}
