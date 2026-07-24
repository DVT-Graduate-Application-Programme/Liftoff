using Application.Queries.GetDashboardMetrics;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public partial class ApplicationRecordRepository
{
    public async Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
    {
        var statusCounts = await _dbContext.ApplicationRecords
            .AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var counts = statusCounts.ToDictionary(a => a.Status, a => a.Count);

        return new DashboardMetricsDto
        {
            TotalApplications = statusCounts.Sum(a => a.Count),
            PendingApplications = counts.GetValueOrDefault("PENDING"),
            ProcessingApplications = counts.GetValueOrDefault("PROCESSING"),
            ValidApplications = counts.GetValueOrDefault("VALID"),
            InvalidApplications = counts.GetValueOrDefault("INVALID"),
            ManualReviewApplications = counts.GetValueOrDefault("MANUAL_REVIEW"),
            ShortlistedApplications = counts.GetValueOrDefault("SHORTLISTED"),
            ErrorApplications = counts.GetValueOrDefault("ERROR")
        };
    }
}
