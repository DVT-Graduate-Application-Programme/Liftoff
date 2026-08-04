using MediatR;

namespace Application.Features.GetDashboardMetrics;

public class GetDashboardMetricsQuery : IRequest<DashboardMetricsDto>
{
}