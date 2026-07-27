using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text.Json;
using Azure.Messaging.ServiceBus;
using Domain.Messaging;
using Microsoft.Extensions.Options;
using Worker.Configuration;

namespace Worker.BackgroundServices;

/// <summary>
/// Consumes <see cref="CvProcessingMessage"/> messages from the Azure Service Bus
/// ingest queue and hands each application off to the hiring agent for evaluation.
/// A transient hand-off failure re-enqueues the message on a delayed (exponential
/// backoff) schedule so it survives an extended hiring-agent outage; once the retry
/// limit is reached, or on a permanent (4xx) rejection, the message is dead-lettered.
/// </summary>
public sealed class ApplicationQueueWorker : BackgroundService
{
    private readonly ServiceBusClient _serviceBusClient;
    private readonly ServiceBusProcessor _processor;
    private readonly ServiceBusSender _sender;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly WorkerOptions _options;
    private readonly ILogger<ApplicationQueueWorker> _logger;

    public ApplicationQueueWorker(
        ServiceBusClient serviceBusClient,
        IHttpClientFactory httpClientFactory,
        IOptions<WorkerOptions> options,
        ILogger<ApplicationQueueWorker> logger)
    {
        _serviceBusClient = serviceBusClient;
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _processor = serviceBusClient.CreateProcessor(_options.QueueName, new ServiceBusProcessorOptions
        {
            // We complete/abandon explicitly so a failed hand-off is retried and
            // eventually dead-lettered rather than silently dropped.
            AutoCompleteMessages = false,
            MaxConcurrentCalls = _options.MaxConcurrentCalls
        });
        // Used to re-enqueue delayed retries onto the same queue.
        _sender = serviceBusClient.CreateSender(_options.QueueName);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // The broker (or the local emulator) may still be initializing when the
        // worker starts. Wait for the queue to be reachable before starting the
        // processor so we don't spam connection/entity-not-found errors.
        await WaitForQueueAsync(stoppingToken);

        _logger.LogInformation(
            "Application Queue Worker starting. Listening on queue '{QueueName}'.",
            _options.QueueName);

        _processor.ProcessMessageAsync += OnMessageAsync;
        _processor.ProcessErrorAsync += OnErrorAsync;

        await _processor.StartProcessingAsync(stoppingToken);
    }

    private async Task WaitForQueueAsync(CancellationToken cancellationToken)
    {
        await using var probe = _serviceBusClient.CreateReceiver(_options.QueueName);
        var delay = TimeSpan.FromSeconds(2);

        for (var attempt = 1; !cancellationToken.IsCancellationRequested; attempt++)
        {
            try
            {
                // A successful peek confirms the namespace is up and the queue exists.
                await probe.PeekMessageAsync(cancellationToken: cancellationToken);
                if (attempt > 1)
                {
                    _logger.LogInformation("Service Bus queue '{QueueName}' is ready.", _options.QueueName);
                }
                return;
            }
            catch (Exception ex) when (ex is ServiceBusException or SocketException)
            {
                _logger.LogWarning(
                    "Waiting for Service Bus queue '{QueueName}' to become available (attempt {Attempt}): {Reason}",
                    _options.QueueName, attempt, ex.Message);
                await Task.Delay(delay, cancellationToken);
                delay = TimeSpan.FromSeconds(Math.Min(delay.TotalSeconds * 1.5, 15));
            }
        }
    }

    private async Task OnMessageAsync(ProcessMessageEventArgs args)
    {
        CvProcessingMessage? message;
        try
        {
            message = args.Message.Body.ToObjectFromJson<CvProcessingMessage>();
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex,
                "Malformed message {MessageId}; dead-lettering.", args.Message.MessageId);
            await args.DeadLetterMessageAsync(
                args.Message, "DeserializationFailed", ex.Message, args.CancellationToken);
            return;
        }

        if (message is null || message.ApplicationId == Guid.Empty)
        {
            _logger.LogWarning(
                "Message {MessageId} had no valid ApplicationId; dead-lettering.", args.Message.MessageId);
            await args.DeadLetterMessageAsync(
                args.Message, "MissingApplicationId", "ApplicationId was null or empty.", args.CancellationToken);
            return;
        }

        try
        {
            await NotifyHiringAgentAsync(message.ApplicationId, args.CancellationToken);
            await args.CompleteMessageAsync(args.Message, args.CancellationToken);
            _logger.LogInformation(
                "Completed processing for application {ApplicationId}.", message.ApplicationId);
        }
        catch (PermanentHandoffException ex)
        {
            // The hiring agent rejected the request (4xx). Retrying will never succeed,
            // so dead-letter immediately instead of burning through delivery attempts.
            _logger.LogError(ex,
                "Permanent hand-off failure for application {ApplicationId}; dead-lettering.",
                message.ApplicationId);
            await args.DeadLetterMessageAsync(
                args.Message, "HiringAgentRejected", ex.Message, args.CancellationToken);
        }
        catch (Exception ex)
        {
            // Transient failure (5xx / timeout / connection) — the HTTP client already
            // retried with backoff. Re-enqueue the message on a delayed schedule so it
            // survives an extended outage, and dead-letter once the retry limit is hit.
            await ScheduleRetryOrDeadLetterAsync(args, message.ApplicationId, ex);
        }
    }

    /// <summary>
    /// Handles a transient hand-off failure by re-enqueuing the message with an
    /// exponentially-increasing <see cref="ServiceBusMessage.ScheduledEnqueueTime"/>,
    /// or dead-lettering it once <see cref="WorkerOptions.MaxTransientRetries"/> is reached.
    /// </summary>
    private async Task ScheduleRetryOrDeadLetterAsync(
        ProcessMessageEventArgs args, Guid applicationId, Exception failure)
    {
        var retryCount = GetRetryCount(args.Message);

        if (retryCount >= _options.MaxTransientRetries)
        {
            _logger.LogError(failure,
                "Transient hand-off for application {ApplicationId} still failing after {RetryCount} retries; dead-lettering.",
                applicationId, retryCount);
            await args.DeadLetterMessageAsync(
                args.Message, "RetryLimitExceeded", failure.Message, args.CancellationToken);
            return;
        }

        var delay = GetRetryDelay(retryCount);
        var retryMessage = new ServiceBusMessage(args.Message.Body)
        {
            ContentType = args.Message.ContentType,
            Subject = args.Message.Subject,
            CorrelationId = args.Message.MessageId,
            ScheduledEnqueueTime = DateTimeOffset.UtcNow + delay
        };
        retryMessage.ApplicationProperties[WorkerOptions.RetryCountProperty] = retryCount + 1;

        // Send the delayed copy first, then complete the current message. If we crash
        // in between, the original lock expires and the message is redelivered
        // (at-least-once) rather than lost — the hiring-agent hand-off is keyed by
        // ApplicationId, so a duplicate notify is harmless.
        await _sender.SendMessageAsync(retryMessage, args.CancellationToken);
        await args.CompleteMessageAsync(args.Message, args.CancellationToken);

        _logger.LogWarning(failure,
            "Transient hand-off failure for application {ApplicationId}; retry {NextRetry}/{MaxRetries} scheduled in {Delay}.",
            applicationId, retryCount + 1, _options.MaxTransientRetries, delay);
    }

    private static int GetRetryCount(ServiceBusReceivedMessage message) =>
        message.ApplicationProperties.TryGetValue(WorkerOptions.RetryCountProperty, out var raw)
            ? Convert.ToInt32(raw)
            : 0;

    private TimeSpan GetRetryDelay(int retryCount)
    {
        var seconds = _options.RetryBaseDelaySeconds * Math.Pow(2, retryCount);
        return TimeSpan.FromSeconds(Math.Min(seconds, _options.RetryMaxDelaySeconds));
    }

    private async Task NotifyHiringAgentAsync(Guid applicationId, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient(WorkerOptions.HiringAgentClientName);
        var payload = new { candidate_id = applicationId };

        using var response = await client.PostAsJsonAsync("/notify", payload, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation(
                "Hiring agent notified for application {ApplicationId}: {ResponseBody}",
                applicationId, responseBody);
            return;
        }

        var status = (int)response.StatusCode;
        var detail = $"Hiring agent returned {status} ({response.StatusCode}): {responseBody}";

        // 4xx = permanent (bad payload / not found); 5xx and anything else = transient
        // (the resilience handler has already exhausted its retries by this point).
        if (status is >= 400 and < 500)
        {
            throw new PermanentHandoffException(detail);
        }

        throw new HttpRequestException(detail);
    }

    private Task OnErrorAsync(ProcessErrorEventArgs args)
    {
        // Transient connectivity issues are auto-retried by the processor; log them
        // compactly. Anything else gets the full exception for diagnosis.
        var isTransient = args.Exception is ServiceBusException { IsTransient: true }
            or ServiceBusException { Reason: ServiceBusFailureReason.ServiceCommunicationProblem
                or ServiceBusFailureReason.ServiceBusy };

        if (isTransient)
        {
            _logger.LogWarning(
                "Transient Service Bus error in {Operation} on '{Entity}': {Reason}",
                args.ErrorSource, args.EntityPath, args.Exception.Message);
        }
        else
        {
            _logger.LogError(args.Exception,
                "Service Bus error in {Operation} on entity '{Entity}'.",
                args.ErrorSource, args.EntityPath);
        }

        return Task.CompletedTask;
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Application Queue Worker stopping.");
        await _processor.StopProcessingAsync(cancellationToken);
        await base.StopAsync(cancellationToken);
    }

    public override void Dispose()
    {
        _processor.DisposeAsync().AsTask().GetAwaiter().GetResult();
        _sender.DisposeAsync().AsTask().GetAwaiter().GetResult();
        base.Dispose();
    }
}
