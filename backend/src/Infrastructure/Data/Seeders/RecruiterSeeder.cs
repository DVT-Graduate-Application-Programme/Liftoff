using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Infrastructure.Data.Seeders;

public static class RecruiterSeeder
{
    public static async Task SeedAsync(GradRecruitmentDbContext db, ILogger logger)
    {
        logger.LogInformation("[RecruiterSeeder] Seeding recruiters…");
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO public."Recruiters" ("Id", "IdentityId", "FirstName", "LastName", "Email", "IsActive", "CreatedAt", "UpdatedAt")
            VALUES
                ('c1000000-0000-0000-0000-000000000001', 'siegfriedmini@gmail.com', 'Sashen',  'Govindasamy', 'siegfriedmini@gmail.com',  TRUE, NOW(), NOW()),
                ('c2000000-0000-0000-0000-000000000002', 'rose@dvtsoftware.com',     'Rose',   'Allen-Richards',  'rose@dvtsoftware.com',    TRUE, NOW(), NOW()),
                ('c3000000-0000-0000-0000-000000000003', 'phindi@dvtsoftware.com',    'Phindile',  'Gamede',       'phindi@dvtsoftware.com',   TRUE, NOW(), NOW())
            ON CONFLICT ("IdentityId") DO NOTHING;
            """);
    }
}
