using Azure.Messaging.ServiceBus;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Options;
using Polly;
using Serilog;
using Worker.BackgroundServices;
using Worker.Configuration;

var builder = Host.CreateApplicationBuilder(args);

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

builder.Services.AddHostedService<ApplicationQueueWorker>();
builder.Services.AddHostedService<DeadLetterMonitor>();

var host = builder.Build();
host.Run();
