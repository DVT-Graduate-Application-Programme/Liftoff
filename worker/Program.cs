using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Azure.Messaging.ServiceBus;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Options;
using Polly;
using Serilog;
using Worker.BackgroundServices;
using Worker.Configuration;
using Worker.Operations;

var builder = WebApplication.CreateBuilder(args);

// Logging configuration
var logDirectory = Environment.GetEnvironmentVariable("LOG_DIRECTORY")
    ?? Path.Combine(AppContext.BaseDirectory, "logs");

Directory.CreateDirectory(logDirectory);
var logFilePath = Path.Combine(logDirectory, "liftoff-worker-.log");

builder.Services.AddSerilog((services, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(builder.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(
            path: logFilePath,
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7,
            shared: true);
});

// Bind worker configuration (env vars override appsettings; e.g. Worker__QueueName)
builder.Services
    .AddOptions<WorkerOptions>()
    .Bind(builder.Configuration.GetSection(WorkerOptions.SectionName))
    .ValidateDataAnnotations();

// Service Bus client (long-lived singleton)
var serviceBusConnectionString = Environment.GetEnvironmentVariable("SERVICEBUS_CONNECTION_STRING")
    ?? builder.Configuration["ServiceBus:ConnectionString"]
    ?? throw new InvalidOperationException(
        "Service Bus connection string is not set. Provide SERVICEBUS_CONNECTION_STRING or ServiceBus:ConnectionString.");

builder.Services.AddSingleton(_ => new ServiceBusClient(serviceBusConnectionString));

// Typed HTTP client for the hiring agent, with Polly retry + exponential backoff.
// The default retry predicate handles transient failures (5xx, 408, timeouts,
// connection errors) and deliberately does NOT retry 4xx responses — those are
// permanent and get dead-lettered by the worker instead.
builder.Services.AddHttpClient(WorkerOptions.HiringAgentClientName, (sp, client) =>
{
    var options = sp.GetRequiredService<IOptions<WorkerOptions>>().Value;
    client.BaseAddress = new Uri(options.HiringAgentBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(options.HiringAgentTimeoutSeconds);
})
.AddResilienceHandler("hiring-agent-retry", (pipeline, context) =>
{
    var options = context.ServiceProvider.GetRequiredService<IOptions<WorkerOptions>>().Value;
    pipeline.AddRetry(new HttpRetryStrategyOptions
    {
        MaxRetryAttempts = options.HiringAgentRetryAttempts,
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true,
        Delay = TimeSpan.FromSeconds(options.HiringAgentRetryBaseDelaySeconds)
    });
});

builder.Services.AddSingleton<DeadLetterReplayer>();
builder.Services.AddHostedService<ApplicationQueueWorker>();
builder.Services.AddHostedService<DeadLetterMonitor>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// Admin: move dead-lettered messages back onto the active queue for reprocessing.
// Guarded by an API key; disabled entirely unless Worker:AdminApiKey is configured.
// A single-slot gate prevents overlapping replays from running concurrently.
var replayGate = new SemaphoreSlim(1, 1);

app.MapPost("/admin/dead-letters/replay", async (
    HttpContext http,
    DeadLetterReplayer replayer,
    IOptions<WorkerOptions> options,
    CancellationToken cancellationToken) =>
{
    var configuredKey = options.Value.AdminApiKey;
    if (string.IsNullOrWhiteSpace(configuredKey))
    {
        return Results.Problem(
            "Admin API is disabled: no Worker:AdminApiKey is configured.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    var providedKey = http.Request.Headers["X-Admin-Api-Key"].ToString();
    if (!IsAuthorized(providedKey, configuredKey))
    {
        return Results.Unauthorized();
    }

    // Reject an overlapping replay rather than queueing behind the one in flight.
    if (!await replayGate.WaitAsync(0, cancellationToken))
    {
        return Results.Conflict(new { message = "A dead-letter replay is already in progress." });
    }

    try
    {
        var replayed = await replayer.ReplayAsync(cancellationToken);
        return Results.Ok(new { replayed });
    }
    finally
    {
        replayGate.Release();
    }
});

app.Run();

// Constant-time comparison so the endpoint doesn't leak the key length/prefix via timing.
static bool IsAuthorized(string provided, string expected)
{
    var providedBytes = Encoding.UTF8.GetBytes(provided);
    var expectedBytes = Encoding.UTF8.GetBytes(expected);
    return CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
}
