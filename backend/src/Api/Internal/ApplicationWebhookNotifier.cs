using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;

namespace Api.Internal;

/// <summary>
/// Fires a fire-and-forget HTTP POST to the Next.js internal webhook endpoint
/// whenever application data changes. The Next.js server is then responsible for
/// pushing the event to all connected browser clients via its own SSE layer.
///
/// Configuration (environment variables or appsettings):
///   NOTIFICATIONS__NEXTJS__WEBHOOKURL  — full URL, e.g. http://frontend:3000/api/internal/notify
///
/// If WebhookUrl is not configured the notifier silently no-ops, so the backend
/// works normally without a frontend connected (useful in isolated testing).
/// </summary>
public sealed class ApplicationWebhookNotifier : IApplicationEventService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _webhookUrl;
    private readonly ILogger<ApplicationWebhookNotifier> _logger;

    public ApplicationWebhookNotifier(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ApplicationWebhookNotifier> logger)
    {
        _httpClientFactory = httpClientFactory;
        _webhookUrl = configuration["Notifications:NextJs:WebhookUrl"];
        _logger = logger;
    }

    // ── IApplicationEventService ──────────────────────────────────────────────

    public void PublishApplicationIngested(Guid applicationId) =>
        Fire("application-ingested", applicationId, changeType: null);

    public void PublishEvaluationSaved(Guid applicationId) =>
        Fire("evaluation-saved", applicationId, changeType: null);

    public void PublishEvaluationReset(Guid applicationId) =>
        Fire("evaluation-reset", applicationId, changeType: null);

    public void PublishOwnershipChanged(Guid applicationId, string changeType) =>
        Fire("ownership-changed", applicationId, changeType);

    // ── Internals ─────────────────────────────────────────────────────────────

    private void Fire(string eventName, Guid applicationId, string? changeType)
    {
        if (string.IsNullOrEmpty(_webhookUrl))
        {
            _logger.LogDebug(
                "Notifications:NextJs:WebhookUrl not configured — skipping notification for {Event}",
                eventName);
            return;
        }

        // Fire-and-forget. We never let a notification failure affect the data operation.
        _ = Task.Run(async () =>
        {
            try
            {
                var client = _httpClientFactory.CreateClient("NextJsWebhook");

                var payload = new
                {
                    @event = eventName,
                    applicationId,
                    changeType,
                    timestamp = DateTimeOffset.UtcNow
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, _webhookUrl)
                {
                    Content = JsonContent.Create(payload)
                };

                var response = await client.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "Next.js webhook returned {StatusCode} for {Event} on application {ApplicationId}",
                        (int)response.StatusCode, eventName, applicationId);
                }
            }
            catch (Exception ex)
            {
                // Swallow — notification failures must never surface to callers.
                _logger.LogError(ex,
                    "Failed to POST {Event} notification to Next.js for application {ApplicationId}",
                    eventName, applicationId);
            }
        });
    }
}
