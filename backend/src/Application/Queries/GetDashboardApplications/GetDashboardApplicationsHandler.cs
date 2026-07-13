using Application.Interfaces;
using MediatR;

namespace Application.Queries.GetDashboardApplications;

public class GetDashboardApplicationsHandler
    : IRequestHandler<GetDashboardApplicationsQuery, List<DashboardApplicationDto>>
{
    private readonly IApplicationRecordRepository _repository;

    public GetDashboardApplicationsHandler(IApplicationRecordRepository repository)
    {
        _repository = repository;
    }

    public Task<List<DashboardApplicationDto>> Handle(
        GetDashboardApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        return _repository.GetDashboardApplicationsAsync(request, cancellationToken);
    }
}
