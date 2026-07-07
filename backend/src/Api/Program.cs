using Api.EndPoints.Applications;
using Backend.Application;
using Backend.Application.Interfaces;
using Backend.Application.Queries.GetResumes;
using Backend.Infrastructure.Storage;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddControllers();

builder.Services.AddHealthChecks();

builder.Services.AddScoped<IResumeStorage, LocalResumeStorage>();

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(GetResumesQuery).Assembly);
    cfg.RegisterServicesFromAssembly(typeof(Application.Features.Ingestion.IngestApplicationRequest).Assembly);
});

// Register Application and Infrastructure DI extensions
Application.DependencyInjection.AddApplication(builder.Services, builder.Configuration);
Infrastructure.DependencyInjection.AddInfrastructure(builder.Services, builder.Configuration);

// Register the Email Polling Background Worker
builder.Services.AddHostedService<Api.BackgroundServices.EmailPollingWorker>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "v1"); 
    });
}

app.MapHealthChecks("/health");

app.MapControllers();
app.MapDashboardEndpoints();

app.Run();