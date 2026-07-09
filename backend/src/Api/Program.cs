using Api.EndPoints.Applications;
using Api.Internal;
using Backend.Application.Interfaces;
using Backend.Application.Queries.GetResumes;
using Backend.Infrastructure.Storage;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddControllers();
builder.Services.AddHealthChecks();

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

// Register the Email Polling Background Worker
//builder.Services.AddHostedService<Api.BackgroundServices.EmailPollingWorker>();

var app = builder.Build();



    app.MapOpenApi();
    app.MapScalarApiReference();



app.MapHealthChecks("/health");

app.MapControllers();
app.MapIngestEndpoints();
app.MapDashboardEndpoints();

app.MapEvaluationEndpoints();

app.MapApplicationEndpoints();


app.Run();