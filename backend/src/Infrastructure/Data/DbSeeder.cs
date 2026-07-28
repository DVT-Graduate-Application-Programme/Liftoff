using Infrastructure.Data.Seeders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Infrastructure.Data;

/// <summary>
/// Orchestrates database initialization and domain aggregate seeding.
/// Delegates aggregate seeding to modular seeder classes (<see cref="RecruiterSeeder"/> and <see cref="ApplicationRecordSeeder"/>).
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GradRecruitmentDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<GradRecruitmentDbContext>>();

        // Apply any pending migrations
        await db.Database.MigrateAsync();

        // 1. Seed Recruiters
        await RecruiterSeeder.SeedAsync(db, logger);

        // 2. Seed Application Records & Associated Data
        await ApplicationRecordSeeder.SeedAsync(db, logger);
    }
}
