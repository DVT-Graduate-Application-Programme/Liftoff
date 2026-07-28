using System.Net.Sockets;
using Azure.Messaging.ServiceBus;
using Microsoft.Extensions.Options;
using Worker.Configuration;

namespace Worker.BackgroundServices;

/// <summary>
/// Periodically peeks the queue's dead-letter sub-queue and surfaces any
/// dead-lettered messages in the logs so poison messages don't accumulate
/// silently. Peeking is non-destructive — messages stay in the DLQ for manual
/// inspection or reprocessing; a sequence-number cursor avoids re-logging the
/// same message on every pass.
/// </summary>
public sealed class DeadLetterMonitor : BackgroundService
{
    private readonly ServiceBusClient _serviceBusClient;
    private readonly WorkerOptions _options;
    private readonly ILogger<DeadLetterMonitor> _logger;
    private long? _lastSequenceNumber;

    public DeadLetterMonitor(
        ServiceBusClient serviceBusClient,
        IOptions<WorkerOptions> options,
        ILogger<DeadLetterMonitor> logger)
    {
        _serviceBusClient = serviceBusClient;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await using var receiver = _serviceBusClient.CreateReceiver(
            _options.QueueName,
            new ServiceBusReceiverOptions { SubQueue = SubQueue.DeadLetter });

        var interval = TimeSpan.FromSeconds(_options.DeadLetterPollSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SurfaceNewDeadLettersAsync(receiver, stoppingToken);
            }
            catch (Exception ex) when (ex is ServiceBusException or SocketException)
            {
                _logger.LogWarning(
                    "Could not read dead-letter queue for '{QueueName}': {Reason}",
                    _options.QueueName, ex.Message);
            }

            await Task.Delay(interval, stoppingToken);
        }
    }

    private async Task SurfaceNewDeadLettersAsync(ServiceBusReceiver receiver, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            // fromSequenceNumber: start from the beginning on the first pass, then
            // advance past the last message we've already logged.
            var fromSequence = _lastSequenceNumber is { } last ? last + 1 : (long?)null;

            var messages = await receiver.PeekMessagesAsync(
                maxMessages: 20,
                fromSequenceNumber: fromSequence,
                cancellationToken: cancellationToken);

            if (messages.Count == 0)
            {
                return;
            }

            foreach (var message in messages)
            {
                _logger.LogError(
                    "Dead-lettered message {MessageId}: reason='{Reason}' description='{Description}' body={Body}",
                    message.MessageId,
                    message.DeadLetterReason ?? "(none)",
                    message.DeadLetterErrorDescription ?? "(none)",
                    message.Body.ToString());

                _lastSequenceNumber = message.SequenceNumber;
            }
        }
    }
}
