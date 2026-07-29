using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Data;

/// <summary>
/// Design-time factory used by the EF Core tools (<c>dotnet ef migrations add</c>,
/// <c>dotnet ef migrations bundle</c>, <c>dotnet ef database update</c>).
///
/// The tools cannot go through <see cref="DependencyInjection.AddInfrastructure"/> because it
/// also requires a Service Bus connection string and throws without one. This factory needs
/// nothing but the database connection, and falls back to a placeholder so that commands which
/// only inspect the model (<c>migrations add</c>, <c>bundle</c>, <c>script</c>) work with no
/// database reachable at all.
/// </summary>
public class GradRecruitmentDbContextFactory : IDesignTimeDbContextFactory<GradRecruitmentDbContext>
{
    public GradRecruitmentDbContext CreateDbContext(string[] args)
    {
        Env.TraversePath().Load();

        var optionsBuilder = new DbContextOptionsBuilder<GradRecruitmentDbContext>();
        optionsBuilder.UseNpgsql(BuildConnectionString());

        return new GradRecruitmentDbContext(optionsBuilder.Options);
    }

    private static string BuildConnectionString()
    {
        // A full connection string wins when supplied — this is what CI passes to efbundle.
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Default");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST");
        var port = Environment.GetEnvironmentVariable("POSTGRES_PORT");
        var database = Environment.GetEnvironmentVariable("POSTGRES_DB");
        var user = Environment.GetEnvironmentVariable("POSTGRES_USER");
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(database)
            || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(password))
        {
            // Model-only commands never open this connection; commands that do will fail
            // with a connection error, which is the correct signal that env vars are missing.
            return "Host=localhost;Port=5432;Database=design_time;Username=design_time;Password=design_time";
        }

        return $"Host={host};Port={port ?? "5432"};Database={database};Username={user};Password={password}";
    }
}
