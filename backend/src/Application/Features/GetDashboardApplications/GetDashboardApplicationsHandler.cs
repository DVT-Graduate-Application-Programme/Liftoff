using Application.Interfaces;
using MediatR;

namespace Application.Features.GetDashboardApplications;

public class GetDashboardApplicationsHandler
    : IRequestHandler<GetDashboardApplicationsQuery, List<DashboardApplicationDto>>
{
    private readonly IDashboardQueryService _dashboardQueryService;

    public GetDashboardApplicationsHandler(IDashboardQueryService dashboardQueryService)
    {
        _dashboardQueryService = dashboardQueryService;
    }

    public Task<List<DashboardApplicationDto>> Handle(
        GetDashboardApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        return _dashboardQueryService.GetDashboardApplicationsAsync(request, cancellationToken);
    }
}
