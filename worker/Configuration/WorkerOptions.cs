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

    /// <summary>Service Bus queue to consume application-ingest messages from.</summary>
    public string QueueName { get; set; } = "application-ingest";

    /// <summary>Base URL of the hiring agent FastAPI service.</summary>
    public string HiringAgentBaseUrl { get; set; } = "http://hiring-agent:8001";

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

    /// <summary>Interval, in seconds, at which the dead-letter queue is polled and surfaced in logs.</summary>
    public int DeadLetterPollSeconds { get; set; } = 30;
}
