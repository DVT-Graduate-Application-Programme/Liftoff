using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Worker.BackgroundServices;

public class ApplicationQueueWorker : BackgroundService
{
    private readonly ILogger<ApplicationQueueWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly TimeSpan _pollingInterval = TimeSpan.FromSeconds(3);

    public ApplicationQueueWorker(
        ILogger<ApplicationQueueWorker> logger,
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _httpClientFactory = httpClientFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Application Queue Background Worker Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessNextPendingJobAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while processing pending application job.");
            }

            await Task.Delay(_pollingInterval, stoppingToken);
        }
    }

    private async Task ProcessNextPendingJobAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IApplicationRecordRepository>();

        // 1. Dequeue the next pending job & transition status to PROCESSING
        var job = await repository.DequeueNextPendingAsync(stoppingToken);
        if (job is null)
        {
            return;
        }

        // 2. Log Job ID & candidate details
        _logger.LogInformation(
            "Dequeued Job ID {JobId} for Candidate {CandidateEmail}. Status transitioned to PROCESSING.",
            job.Id,
            job.CandidateEmail ?? "N/A");

        // 3. Notify the Hiring Agent service
        await NotifyHiringAgentAsync(job.Id, stoppingToken);
    }

    private async Task NotifyHiringAgentAsync(Guid applicationId, CancellationToken stoppingToken)
    {
        const string fastApiBaseUrl = "http://hiring-agent:8001";
        try
        {
            var client = _httpClientFactory.CreateClient();
            var payload = new { candidate_id = applicationId };
            
            HttpResponseMessage response = await client.PostAsJsonAsync(
                $"{fastApiBaseUrl}/notify", 
                payload, 
                stoppingToken);
                
            response.EnsureSuccessStatusCode();
            string responseBody = await response.Content.ReadAsStringAsync(stoppingToken);
            _logger.LogInformation("Hiring agent notified for Job ID {JobId}: {ResponseBody}", applicationId, responseBody);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to notify hiring agent for Job ID {JobId}: {Message}", applicationId, ex.Message);
            // Swallow notification errors so background loop continues seamlessly
        }
    }
}
