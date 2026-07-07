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
builder.Services.AddScoped<IngestApplicationHandler>();

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(GetResumesQuery).Assembly);
});

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
app.MapIngestEndpoints();
app.MapDashboardEndpoints();

app.Run();