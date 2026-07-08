using MediatR;

namespace Application.Queries.GetDashboardMetrics;

public class GetDashboardMetricsQuery : IRequest<DashboardMetricsDto>
{
}