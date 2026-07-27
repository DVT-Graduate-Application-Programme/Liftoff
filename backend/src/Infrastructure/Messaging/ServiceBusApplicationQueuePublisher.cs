using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Azure.Messaging.ServiceBus;
using Domain.Messaging;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Messaging;

/// <summary>
/// Azure Service Bus implementation of <see cref="IApplicationQueuePublisher"/>.
/// The underlying <see cref="ServiceBusClient"/> and <see cref="ServiceBusSender"/>
/// are long-lived and registered as singletons; this class is safe to resolve
/// from scoped consumers.
/// </summary>
public sealed class ServiceBusApplicationQueuePublisher : IApplicationQueuePublisher
{
    private readonly ServiceBusSender _sender;
    private readonly ILogger<ServiceBusApplicationQueuePublisher> _logger;

    public ServiceBusApplicationQueuePublisher(
        ServiceBusSender sender,
        ILogger<ServiceBusApplicationQueuePublisher> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task PublishAsync(CvProcessingMessage message, CancellationToken cancellationToken = default)
    {
        var serviceBusMessage = new ServiceBusMessage(JsonSerializer.SerializeToUtf8Bytes(message))
        {
            // MessageId enables duplicate detection when the namespace is Standard tier
            // and is a stable correlation key regardless of tier.
            MessageId = message.ApplicationId.ToString(),
            ContentType = "application/json",
            Subject = nameof(CvProcessingMessage)
        };

        await _sender.SendMessageAsync(serviceBusMessage, cancellationToken);

        _logger.LogInformation(
            "Published CvProcessingMessage for application {ApplicationId} to queue.",
            message.ApplicationId);
    }
}
