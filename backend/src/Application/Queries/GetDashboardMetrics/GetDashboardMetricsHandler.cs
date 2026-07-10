using Application.Interfaces;
using MediatR;

namespace Application.Queries.GetDashboardMetrics;

public class GetDashboardMetricsHandler
    : IRequestHandler<GetDashboardMetricsQuery, DashboardMetricsDto>
{
    private readonly IApplicationRecordRepository _repository;

    public GetDashboardMetricsHandler(IApplicationRecordRepository repository)
    {
        _repository = repository;
    }

    public Task<DashboardMetricsDto> Handle(
        GetDashboardMetricsQuery request,
        CancellationToken cancellationToken)
    {
        return _repository.GetDashboardMetricsAsync(cancellationToken);
    }
}
