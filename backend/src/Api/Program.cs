using Api.EndPoints.Applications;
using Api.Internal;
using Backend.Application.Interfaces;
using Backend.Application.Queries.GetResumes;
using Backend.Infrastructure.Storage;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddControllers();
builder.Services.AddHealthChecks();

builder.Services.AddScoped<IResumeStorage, LocalResumeStorage>();
builder.Services.AddScoped<IngestApplicationHandler>();

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(GetResumesQuery).Assembly);
});

var app = builder.Build();

//if (app.Environment.IsDevelopment())
//{
    app.MapOpenApi();
    app.MapScalarApiReference();
//}

app.MapHealthChecks("/health");

app.MapControllers();
app.MapIngestEndpoints();
app.MapDashboardEndpoints();
app.MapTranscriptEndpoints();

app.Run();