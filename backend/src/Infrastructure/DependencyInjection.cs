using Application.Interfaces;
using Infrastructure.Data;
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

        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? configuration["POSTGRES_HOST"] ?? "localhost";
        var port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? configuration["POSTGRES_PORT"] ?? "5432";
        var db = Environment.GetEnvironmentVariable("POSTGRES_DB") ?? configuration["POSTGRES_DB"] ?? "GradRecruitmentDb"; 
        var user = Environment.GetEnvironmentVariable("POSTGRES_USER") ?? configuration["POSTGRES_USER"] ?? "postgres";
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? configuration["POSTGRES_PASSWORD"] ?? "postgres";
        
        var connectionString = $"Host={host};Port={port};Database={db};Username={user};Password={password}";

        services.AddDbContext<GradRecruitmentDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationRecordRepository, ApplicationRecordRepository>();
        services.AddScoped<IRecruiterRepository, RecruiterRepository>();
        services.AddScoped<IRecruiterAssignmentService, RecruiterAssignmentService>();
        services.AddScoped<IGraphEmailService, GraphEmailService>();
        services.AddScoped<IAttachmentRetriever, UrlAttachmentRetriever>();
        return services;
    }
}
