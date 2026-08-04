using System.ComponentModel.DataAnnotations;

namespace Worker.Configuration;

/// <summary>
/// Strongly-typed configuration for the background worker, bound from the
/// "Worker" configuration section with environment-variable overrides.
/// </summary>
public sealed class WorkerOptions
{
    public const string SectionName = "Worker";

    /// <summary>Named <see cref="System.Net.Http.HttpClient"/> used to reach the hiring agent.</summary>
    public const string HiringAgentClientName = "hiring-agent";

    /// <summary>
    /// Application-property key carrying the delayed-retry counter across re-enqueues.
    /// Shared by the worker (which increments it) and the replayer (which strips it so a
    /// manually replayed message starts with a fresh retry budget).
    /// </summary>
    public const string RetryCountProperty = "RetryCount";

    /// <summary>Service Bus queue to consume application-ingest messages from.</summary>
    public string QueueName { get; set; } = "application-ingest";

    /// <summary>
    /// Base URL of the hiring agent FastAPI service. No default in code — it differs per
    /// environment (the compose hostname locally, the agent's internal Container Apps URL
    /// when deployed), so it comes from appsettings.json or the <c>Worker__HiringAgentBaseUrl</c>
    /// environment variable. Startup fails when it is missing rather than silently pointing
    /// the worker at a host that does not exist.
    /// </summary>
    [Required]
    public string HiringAgentBaseUrl { get; set; } = string.Empty;

    /// <summary>Maximum messages processed concurrently by the Service Bus processor.</summary>
    public int MaxConcurrentCalls { get; set; } = 1;

    /// <summary>HTTP request timeout, in seconds, for hiring-agent calls.</summary>
    public int HiringAgentTimeoutSeconds { get; set; } = 100;

    /// <summary>
    /// Number of Polly retry attempts (in addition to the first try) for transient
    /// hiring-agent failures (5xx, 408, timeouts, connection errors). Kept modest so
    /// the total retry window stays well within the Service Bus lock/auto-renewal.
    /// </summary>
    public int HiringAgentRetryAttempts { get; set; } = 4;

    /// <summary>Base delay, in seconds, for the exponential backoff between retries.</summary>
    public double HiringAgentRetryBaseDelaySeconds { get; set; } = 1;

    /// <summary>
    /// Maximum number of delayed re-enqueue retries for a transient hiring-agent
    /// failure before the message is dead-lettered. This is the message-level retry
    /// budget (each attempt spans an in-request Polly retry cycle) and, unlike the
    /// queue's MaxDeliveryCount, it survives re-sends because the count is carried in
    /// the message itself.
    /// </summary>
    public int MaxTransientRetries { get; set; } = 10;

    /// <summary>
    /// Base delay, in seconds, for the delayed re-enqueue backoff. Retry N is scheduled
    /// after min(base * 2^N, <see cref="RetryMaxDelaySeconds"/>) seconds.
    /// </summary>
    public double RetryBaseDelaySeconds { get; set; } = 30;

    /// <summary>Upper bound, in seconds, on the delayed re-enqueue backoff.</summary>
    public double RetryMaxDelaySeconds { get; set; } = 300;

    /// <summary>Interval, in seconds, at which the dead-letter queue is polled and surfaced in logs.</summary>
    public int DeadLetterPollSeconds { get; set; } = 30;

    /// <summary>
    /// API key required to call the admin endpoints (e.g. dead-letter replay), supplied
    /// by callers in the <c>X-Admin-Api-Key</c> header. When null/empty the admin
    /// endpoints are disabled, so a key must be configured to enable them.
    /// </summary>
    public string? AdminApiKey { get; set; }
}
