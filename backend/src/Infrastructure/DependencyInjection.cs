using Application.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {

        var host = configuration["POSTGRES_HOST"] ?? "localhost";
        var port = configuration["POSTGRES_PORT"] ?? "5432";
        var db = configuration["POSTGRES_DB"] ?? "GradRecruitmentDb"; 
        var user = configuration["POSTGRES_USER"] ?? "postgres";
        var password = configuration["POSTGRES_PASSWORD"] ?? "postgres";

        var connectionString = $"Host={host};Port={port};Database={db};Username={user};Password={password}";

        services.AddDbContext<GradRecruitmentDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IGraphEmailService, GraphEmailService>();

        return services;
    }
}
