using Api.EndPoints.Applications;
using Api.Internal;
using Application.Handler;
using Application.Interfaces;
using Backend.Application.Interfaces;
using Backend.Application.Queries.GetResumes;
using Backend.Infrastructure.Storage;

using Infrastructure.Data;

using Scalar.AspNetCore;

using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Use LOG_DIRECTORY if it's provided, otherwise default to backend/logs.
var backendRoot = Path.GetFullPath(
    Path.Combine(builder.Environment.ContentRootPath, "..", ".."));

var logDirectory = Environment.GetEnvironmentVariable("LOG_DIRECTORY")
    ?? Path.Combine(backendRoot, "logs");

Directory.CreateDirectory(logDirectory);

var logFilePath = Path.Combine(logDirectory, "liftoff-.log");

builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(
            path: logFilePath,
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7,
            shared: true);
});

builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddControllers();
builder.Services.AddHealthChecks();

// ── SSE: Next.js webhook notifier ──
// The C# backend POSTs a lightweight JSON payload to the Next.js /api/internal/notify
// route whenever application data changes. Next.js then broadcasts to browser clients.
//
// Required env vars (optional — notifier silently no-ops when not set):
//   NOTIFICATIONS__NEXTJS__WEBHOOKURL   e.g. http://frontend:3000/api/internal/notify
//   NOTIFICATIONS__NEXTJS__SHAREDSECRET e.g. a strong random string
builder.Services.AddHttpClient("NextJsWebhook", client =>
{
    client.Timeout = TimeSpan.FromSeconds(5);
});
builder.Services.AddScoped<IApplicationEventService, ApplicationWebhookNotifier>();

// ── Graph / AI ingestion pipeline – not needed for POC ──
builder.Services.AddScoped<IResumeStorage, LocalResumeStorage>();
builder.Services.AddScoped<IngestApplicationHandler>();

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(GetResumesQuery).Assembly);
    cfg.RegisterServicesFromAssembly(typeof(Application.Features.Ingestion.IngestApplicationRequest).Assembly);
});

// Register Application and Infrastructure DI extensions
Application.DependencyInjection.AddApplication(builder.Services, builder.Configuration);
Infrastructure.DependencyInjection.AddInfrastructure(builder.Services, builder.Configuration);

var app = builder.Build();

app.UseSerilogRequestLogging();

await GradRecruitmentSchemaInitializer.EnsureSchemaAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapHealthChecks("/health");

// ── Graph / AI ingestion pipeline – not needed for POC ──
// app.MapControllers();          // ResumeController (old local-storage route)
app.MapIngestEndpoints();         // POST /api/applications/ingest
app.MapEvaluationEndpoints();  // POST /internal/evaluation      (AI agent webhook callback)

// ── POC endpoints ── active ──
app.MapDashboardEndpoints();
app.MapApplicationEndpoints();

// Seed POC data on startup (idempotent – skips if rows already exist)
if (!app.Environment.IsEnvironment("Testing"))
{
    await DbSeeder.SeedAsync(app.Services);
}

app.Run();

public partial class Program;
