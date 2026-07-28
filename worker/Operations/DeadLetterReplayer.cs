using Azure.Messaging.ServiceBus;
using Microsoft.Extensions.Options;
using Worker.Configuration;

namespace Worker.Operations;

/// <summary>
/// One-shot operation that drains the queue's dead-letter sub-queue back onto the
/// active queue so poison messages can be reprocessed after the underlying problem
/// is fixed. Invoked via the <c>--replay-dlq</c> startup flag rather than running
/// as a hosted service. Each replayed message starts with a fresh retry budget (the
/// delayed-retry counter is stripped) and its original identity is preserved for tracing.
/// </summary>
public sealed class DeadLetterReplayer
{
    private readonly ServiceBusClient _client;
    private readonly WorkerOptions _options;
    private readonly ILogger<DeadLetterReplayer> _logger;

    public DeadLetterReplayer(
        ServiceBusClient client,
        IOptions<WorkerOptions> options,
        ILogger<DeadLetterReplayer> logger)
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<int> ReplayAsync(CancellationToken cancellationToken = default)
    {
        await using var receiver = _client.CreateReceiver(
            _options.QueueName,
            new ServiceBusReceiverOptions { SubQueue = SubQueue.DeadLetter });
        await using var sender = _client.CreateSender(_options.QueueName);

        _logger.LogInformation(
            "Replaying dead-letter queue for '{QueueName}' onto the active queue…", _options.QueueName);

        var replayed = 0;
        while (!cancellationToken.IsCancellationRequested)
        {
            var batch = await receiver.ReceiveMessagesAsync(
                maxMessages: 20, maxWaitTime: TimeSpan.FromSeconds(5), cancellationToken);

            if (batch.Count == 0)
            {
                break;
            }

            foreach (var dead in batch)
            {
                var revived = new ServiceBusMessage(dead.Body)
                {
                    ContentType = dead.ContentType,
                    Subject = dead.Subject,
                    MessageId = dead.MessageId,
                    CorrelationId = dead.CorrelationId
                };

                // Carry over any custom properties, but drop the retry counter so the
                // replayed message gets the full delayed-retry budget again.
                foreach (var (key, value) in dead.ApplicationProperties)
                {
                    if (key == WorkerOptions.RetryCountProperty)
                    {
                        continue;
                    }
                    revived.ApplicationProperties[key] = value;
                }

                // Send the copy onto the active queue first, then remove the original
                // from the DLQ. A crash in between leaves the message in the DLQ to be
                // replayed again rather than losing it.
                await sender.SendMessageAsync(revived, cancellationToken);
                await receiver.CompleteMessageAsync(dead, cancellationToken);
                replayed++;

                _logger.LogInformation(
                    "Replayed dead-lettered message {MessageId} (reason was '{Reason}').",
                    dead.MessageId, dead.DeadLetterReason ?? "(none)");
            }
        }

        _logger.LogInformation(
            "Dead-letter replay complete for '{QueueName}': {Count} message(s) moved back to the active queue.",
            _options.QueueName, replayed);

        return replayed;
    }
}
