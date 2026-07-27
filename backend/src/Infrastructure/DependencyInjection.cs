using Application.Interfaces;
using Azure.Messaging.ServiceBus;
using Infrastructure.Data;
using Infrastructure.Messaging;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using DotNetEnv;
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
        services.AddScoped<IRecruiterRepository, RecruiterRepository>();
        services.AddScoped<IRecruiterAssignmentService, RecruiterAssignmentService>();
        services.AddScoped<IGraphEmailService, GraphEmailService>();
        services.AddScoped<IAttachmentRetriever, UrlAttachmentRetriever>();

        AddServiceBusPublisher(services, configuration);

        return services;
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
