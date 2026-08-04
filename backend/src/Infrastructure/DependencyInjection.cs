using Application.Interfaces;
using Azure.Messaging.ServiceBus;
using Azure.Storage.Blobs;
using Infrastructure.Data;
using Infrastructure.Messaging;
using Infrastructure.Services;
using Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using DotNetEnv;
using Application.Ai;
namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        Env.TraversePath().Load();

        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? configuration["POSTGRES_HOST"];
        var port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? configuration["POSTGRES_PORT"];
        var db = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? configuration["POSTGRES_DB"]; 
        var user = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? configuration["POSTGRES_USER"];
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? configuration["POSTGRES_PASSWORD"];

        if(string.IsNullOrEmpty(host) || string.IsNullOrEmpty(port) || string.IsNullOrEmpty(db) || string.IsNullOrEmpty(user) || string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException("Database connection parameters are not set in environment variables or configuration.");
        }
        
        var connectionString = $"Host={host};Port={port};Database={db};Username={user};Password={password}";

        services.AddDbContext<GradRecruitmentDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationRecordRepository, ApplicationRecordRepository>();
        services.AddScoped<IDashboardQueryService, DashboardQueryService>();
        services.AddScoped<IApplicationQueryService, ApplicationQueryService>();
        services.AddScoped<IApplicationOwnershipService, ApplicationOwnershipService>();
        services.AddScoped<IApplicationEvaluationService, ApplicationEvaluationService>();
        services.AddScoped<IRecruiterRepository, RecruiterRepository>();
        services.AddScoped<IRecruiterAssignmentService, RecruiterAssignmentService>();
        services.AddScoped<IGraphEmailService, GraphEmailService>();
        services.AddScoped<IAttachmentRetriever, UrlAttachmentRetriever>();

        services.AddHttpClient<IAttachmentClassificationService, OllamaAttachmentClassificationService>(client =>
        {
            var ollamaBaseUrl = configuration["Ollama:BaseUrl"] ?? "http://localhost:11434";
            client.BaseAddress = new Uri(ollamaBaseUrl);
        });

        AddServiceBusPublisher(services, configuration);
        AddDocumentStorage(services, configuration);

        return services;
    }

    private static void AddDocumentStorage(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING")
            ?? configuration["Storage:ConnectionString"];

        // Deliberately fatal rather than falling back to local disk: a silent fallback is
        // exactly the failure mode this replaces — the app keeps working right up until the
        // container recycles, and every CV uploaded since the last restart is gone.
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException(
                "Blob storage connection string is not set. Provide STORAGE_CONNECTION_STRING or Storage:ConnectionString.");
        }

        var options = new DocumentStorageOptions
        {
            CvContainer = Environment.GetEnvironmentVariable("STORAGE_CV_CONTAINER")
                ?? configuration["Storage:CvContainer"]
                ?? "cvs",
            TranscriptContainer = Environment.GetEnvironmentVariable("STORAGE_TRANSCRIPT_CONTAINER")
                ?? configuration["Storage:TranscriptContainer"]
                ?? "transcripts"
        };

        // BlobServiceClient is thread-safe and intended to be long-lived, like ServiceBusClient.
        services.AddSingleton(_ => new BlobServiceClient(connectionString));
        services.AddSingleton(options);
        services.AddSingleton<IDocumentStorage, BlobDocumentStorage>();
    }

    private static void AddServiceBusPublisher(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = Environment.GetEnvironmentVariable("SERVICEBUS_CONNECTION_STRING")
            ?? configuration["ServiceBus:ConnectionString"];
        var queueName = Environment.GetEnvironmentVariable("SERVICEBUS_QUEUE_NAME")
            ?? configuration["ServiceBus:QueueName"]
            ?? "application-ingest";

        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException(
                "Service Bus connection string is not set. Provide SERVICEBUS_CONNECTION_STRING or ServiceBus:ConnectionString.");
        }

        // ServiceBusClient and ServiceBusSender are thread-safe and intended to be
        // long-lived, so both are registered as singletons.
        services.AddSingleton(_ => new ServiceBusClient(connectionString));
        services.AddSingleton(sp => sp.GetRequiredService<ServiceBusClient>().CreateSender(queueName));
        services.AddSingleton<IApplicationQueuePublisher, ServiceBusApplicationQueuePublisher>();
    }
}
