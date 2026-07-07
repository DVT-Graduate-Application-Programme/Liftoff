using Application.Interfaces;
using Azure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Services;

public class GraphEmailService : IGraphEmailService
{
    private readonly GraphServiceClient _graphClient;

    public GraphEmailService(IConfiguration configuration)
    {
        // Using Client Credentials flow
        var tenantId = configuration["Graph:TenantId"];
        var clientId = configuration["Graph:ClientId"];
        var clientSecret = configuration["Graph:ClientSecret"];

        var options = new ClientSecretCredentialOptions
        {
            AuthorityHost = AzureAuthorityHosts.AzurePublicCloud,
        };

        var clientSecretCredential = new ClientSecretCredential(
            tenantId, clientId, clientSecret, options);

        _graphClient = new GraphServiceClient(clientSecretCredential, new[] { "https://graph.microsoft.com/.default" });
    }

    public async Task<List<EmailAttachmentDto>> GetAttachmentsAsync(string userId, string messageId, CancellationToken cancellationToken = default)
    {
        var result = new List<EmailAttachmentDto>();

        var attachments = await _graphClient.Users[userId].Messages[messageId].Attachments
            .GetAsync(requestConfiguration => 
            {
                requestConfiguration.QueryParameters.Select = new[] { "id", "name", "contentType", "contentBytes" };
            }, cancellationToken);

        if (attachments?.Value != null)
        {
            foreach (var attachment in attachments.Value)
            {
                if (attachment is FileAttachment fileAttachment && fileAttachment.ContentBytes != null)
                {
                    result.Add(new EmailAttachmentDto
                    {
                        Id = fileAttachment.Id ?? string.Empty,
                        Name = fileAttachment.Name ?? string.Empty,
                        ContentType = fileAttachment.ContentType ?? "application/octet-stream",
                        ContentBytes = fileAttachment.ContentBytes
                    });
                }
            }
        }

        return result;
    }

    public async Task<EmailAttachmentDto?> GetAttachmentByIdAsync(string userId, string messageId, string attachmentId, CancellationToken cancellationToken = default)
    {
        var attachment = await _graphClient.Users[userId].Messages[messageId].Attachments[attachmentId]
            .GetAsync(requestConfiguration => 
            {
                requestConfiguration.QueryParameters.Select = new[] { "id", "name", "contentType", "contentBytes" };
            }, cancellationToken);

        if (attachment is FileAttachment fileAttachment && fileAttachment.ContentBytes != null)
        {
            return new EmailAttachmentDto
            {
                Id = fileAttachment.Id ?? string.Empty,
                Name = fileAttachment.Name ?? string.Empty,
                ContentType = fileAttachment.ContentType ?? "application/octet-stream",
                ContentBytes = fileAttachment.ContentBytes
            };
        }

        return null;
    }

    public async Task<List<EmailMessageDto>> GetUnreadMessagesAsync(string userId, int top = 10, CancellationToken cancellationToken = default)
    {
        var result = new List<EmailMessageDto>();

        var messages = await _graphClient.Users[userId].Messages
            .GetAsync(requestConfiguration =>
            {
                requestConfiguration.QueryParameters.Filter = "isRead eq false and hasAttachments eq true";
                requestConfiguration.QueryParameters.Top = top;
                requestConfiguration.QueryParameters.Select = new[] { "id", "from", "subject", "bodyPreview" };
            }, cancellationToken);

        if (messages?.Value != null)
        {
            foreach (var message in messages.Value)
            {
                result.Add(new EmailMessageDto
                {
                    MessageId = message.Id ?? string.Empty,
                    FromEmail = message.From?.EmailAddress?.Address ?? string.Empty,
                    Subject = message.Subject ?? string.Empty,
                    BodyPreview = message.BodyPreview ?? string.Empty
                });
            }
        }

        return result;
    }

    public async Task MarkMessageAsReadAsync(string userId, string messageId, CancellationToken cancellationToken = default)
    {
        var requestBody = new Message
        {
            IsRead = true
        };

        await _graphClient.Users[userId].Messages[messageId]
            .PatchAsync(requestBody, cancellationToken: cancellationToken);
    }
}
