using Serilog;
using Worker.BackgroundServices;

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

// Register Application and Infrastructure DI extensions
Application.DependencyInjection.AddApplication(builder.Services, builder.Configuration);
Infrastructure.DependencyInjection.AddInfrastructure(builder.Services, builder.Configuration);

// Register HTTP Client and Database Queue Background Worker Service
builder.Services.AddHttpClient();
builder.Services.AddHostedService<ApplicationQueueWorker>();

var host = builder.Build();
host.Run();
