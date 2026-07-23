using Domain.Entities;

using Infrastructure.Data;

namespace Api.IntegrationTests;

public class RecruiterRoundRobinTests
{
    [Fact]
    public void SelectNextRecruiterForRoundRobin_AdvancesToNextRecruiterInCycle()
    {
        var recruiters = new List<Recruiter>
        {
            new() { IdentityId = "r1", FirstName = "Ada", LastName = "Lovelace", IsActive = true, CreatedAt = DateTimeOffset.Parse("2024-01-01T00:00:00Z") },
            new() { IdentityId = "r2", FirstName = "Grace", LastName = "Hopper", IsActive = true, CreatedAt = DateTimeOffset.Parse("2024-01-02T00:00:00Z") },
            new() { IdentityId = "r3", FirstName = "Margaret", LastName = "Hamilton", IsActive = true, CreatedAt = DateTimeOffset.Parse("2024-01-03T00:00:00Z") }
        };

        var next = RecruiterRepository.SelectNextRecruiterForRoundRobin(recruiters, "r1");

        Assert.NotNull(next);
        Assert.Equal("r2", next!.IdentityId);
    }

    [Fact]
    public void SelectNextRecruiterForRoundRobin_WrapsAroundToFirstRecruiter()
    {
        var recruiters = new List<Recruiter>
        {
            new() { IdentityId = "r1", FirstName = "Ada", LastName = "Lovelace", IsActive = true, CreatedAt = DateTimeOffset.Parse("2024-01-01T00:00:00Z") },
            new() { IdentityId = "r2", FirstName = "Grace", LastName = "Hopper", IsActive = true, CreatedAt = DateTimeOffset.Parse("2024-01-02T00:00:00Z") },
            new() { IdentityId = "r3", FirstName = "Margaret", LastName = "Hamilton", IsActive = true, CreatedAt = DateTimeOffset.Parse("2024-01-03T00:00:00Z") }
        };

        var next = RecruiterRepository.SelectNextRecruiterForRoundRobin(recruiters, "r3");

        Assert.NotNull(next);
        Assert.Equal("r1", next!.IdentityId);
    }

    [Fact]
    public void SelectNextRecruiterForRoundRobin_IgnoresInactiveRecruiters()
    {
        var recruiters = new List<Recruiter>
        {
            new() { IdentityId = "r1", FirstName = "Ada", LastName = "Lovelace", IsActive = true, CreatedAt = DateTimeOffset.Parse("2024-01-01T00:00:00Z") },
            new() { IdentityId = "r2", FirstName = "Grace", LastName = "Hopper", IsActive = false, CreatedAt = DateTimeOffset.Parse("2024-01-02T00:00:00Z") },
            new() { IdentityId = "r3", FirstName = "Margaret", LastName = "Hamilton", IsActive = true, CreatedAt = DateTimeOffset.Parse("2024-01-03T00:00:00Z") }
        };

        var next = RecruiterRepository.SelectNextRecruiterForRoundRobin(recruiters, "r1");

        Assert.NotNull(next);
        Assert.Equal("r3", next!.IdentityId);
    }
}
