using Application.Features.GetDashboardApplications;
using Application.Features.GetDashboardMetrics;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public interface IDashboardQueryService
{
    Task<List<DashboardApplicationDto>> GetDashboardApplicationsAsync(GetDashboardApplicationsQuery query, CancellationToken cancellationToken = default);
    Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default);
}
