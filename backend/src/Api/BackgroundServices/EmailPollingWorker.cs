using Application.Features.Ingestion;
using Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Api.BackgroundServices;

public class EmailPollingWorker : BackgroundService
{
    private readonly ILogger<EmailPollingWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly string _pollingInbox;
    private readonly int _pollingIntervalMinutes;

    public EmailPollingWorker(
        ILogger<EmailPollingWorker> logger,
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _pollingInbox = configuration["Graph:PollingInbox"] ;
        _pollingIntervalMinutes = configuration.GetValue<int>("Graph:PollingIntervalMinutes", 2);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email Polling Worker started. Polling inbox: {Inbox}", _pollingInbox);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollEmailsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while polling emails.");
            }

            // Wait for the next polling interval
            await Task.Delay(TimeSpan.FromMinutes(_pollingIntervalMinutes), stoppingToken);
        }
    }

    private async Task PollEmailsAsync(CancellationToken stoppingToken)
    {
        // Because BackgroundService is a singleton and we need scoped services (like DbContext and MediatR)
        using var scope = _scopeFactory.CreateScope();
        
        var graphEmailService = scope.ServiceProvider.GetRequiredService<IGraphEmailService>();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        // 1. Get Unread Messages
        var unreadMessages = await graphEmailService.GetUnreadMessagesAsync(_pollingInbox, top: 10, stoppingToken);

        if (unreadMessages.Count > 0)
        {
            _logger.LogInformation("Found {Count} unread messages.", unreadMessages.Count);
        }

        foreach (var message in unreadMessages)
        {
            _logger.LogInformation("Processing message {MessageId} from {From}", message.MessageId, message.FromEmail);

            // 2. Dispatch the Ingestion Command
            var request = new IngestApplicationRequest
            {
                MessageId = message.MessageId,
                UserId = _pollingInbox,
                From = message.FromEmail,
                Subject = message.Subject
            };

            var success = await mediator.Send(request, stoppingToken);

            // 3. Mark as Read if successful
            if (success)
            {
                await graphEmailService.MarkMessageAsReadAsync(_pollingInbox, message.MessageId, stoppingToken);
                _logger.LogInformation("Successfully processed and marked message {MessageId} as read.", message.MessageId);
            }
            else
            {
                _logger.LogWarning("Failed to process message {MessageId}. Leaving as unread.", message.MessageId);
            }
        }
    }
}
