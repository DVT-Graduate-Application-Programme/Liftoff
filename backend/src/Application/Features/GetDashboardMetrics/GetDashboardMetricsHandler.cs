using Application.Interfaces;
using MediatR;

namespace Application.Features.GetDashboardMetrics;

public class GetDashboardMetricsHandler
    : IRequestHandler<GetDashboardMetricsQuery, DashboardMetricsDto>
{
    private readonly IDashboardQueryService _dashboardQueryService;

    public GetDashboardMetricsHandler(IDashboardQueryService dashboardQueryService)
    {
        _dashboardQueryService = dashboardQueryService;
    }

    public Task<DashboardMetricsDto> Handle(
        GetDashboardMetricsQuery request,
        CancellationToken cancellationToken)
    {
        return _dashboardQueryService.GetDashboardMetricsAsync(cancellationToken);
    }
}
