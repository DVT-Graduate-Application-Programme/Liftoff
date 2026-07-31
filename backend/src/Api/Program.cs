using Api.EndPoints.Applications;
using Api.Internal;
using Application.Interfaces;
using Backend.Application.Interfaces;
using Backend.Application.Queries.GetResumes;
using Backend.Infrastructure.Storage;
using Application.Features.IngestApplication;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

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
builder.Services.AddSingleton<IResumeStorage, LocalResumeStorage>();
builder.Services.AddScoped<ICvStorage, LocalStorage>(); 

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(GetResumesQuery).Assembly);
    cfg.RegisterServicesFromAssembly(typeof(IngestApplicationRequest).Assembly);
    cfg.AddOpenBehavior(typeof(Application.Common.Behaviors.ValidationBehavior<,>));
});

// Register Application and Infrastructure DI extensions
Application.DependencyInjection.AddApplication(builder.Services, builder.Configuration);
Infrastructure.DependencyInjection.AddInfrastructure(builder.Services, builder.Configuration);


var app = builder.Build();

app.UseMiddleware<ValidationExceptionMiddleware>();
app.UseSerilogRequestLogging();

// Schema is owned by EF Core migrations (src/Infrastructure/Migrations). Deployed
// environments apply them from the migrations job before the new image rolls out, so the
// API never issues DDL there — a bad migration fails the deploy instead of the running app.
// Locally the API migrates itself so `docker compose up` still gives a working database.
//
// Gated on an explicit opt-in flag rather than ASPNETCORE_ENVIRONMENT, because the deployed
// Azure backend also runs as "Development" (it relies on that to expose the Scalar UI). An
// environment-name check would therefore migrate the deployed database on every boot and,
// worse, let DbSeeder truncate it. Only docker-compose.yml sets this flag, so no deployed
// environment can seed by accident regardless of what it calls itself.
if (app.Configuration.GetValue<bool>("Database:AutoMigrateAndSeed"))
{
    await using (var scope = app.Services.CreateAsyncScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<GradRecruitmentDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    // Sample applications and recruiters are a local-development convenience only; they
    // must never be written to the deployed databases.
    await DbSeeder.SeedAsync(app.Services);
}

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
app.MapApplicationQueryEndpoints();
app.MapApplicationOwnershipEndpoints();
app.MapRecruiterEndpoints();


app.Run();

public partial class Program;
