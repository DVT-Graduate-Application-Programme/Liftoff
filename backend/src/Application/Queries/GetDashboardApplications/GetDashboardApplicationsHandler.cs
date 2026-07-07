using MediatR;

namespace Application.Queries.GetDashboardApplications;

public class GetDashboardApplicationsHandler
    : IRequestHandler<GetDashboardApplicationsQuery, List<DashboardApplicationDto>>
{
    private static readonly List<DashboardApplicationDto> MockApplications = DashboardSampleData.GetApplications();

    public Task<List<DashboardApplicationDto>> Handle(
        GetDashboardApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        var results = MockApplications.AsEnumerable();

        if (request.Status is not null)
            results = results.Where(a => a.CurrentStatus == request.Status);

        if (request.Tier is not null)
            results = results.Where(a => a.Tier == request.Tier);

        if (request.HardGatePassed is not null)
            results = results.Where(a => a.HardGatePassed == request.HardGatePassed);

        if (request.IsClaimed is not null)
            results = request.IsClaimed.Value
                ? results.Where(a => a.ClaimedByRecruiterId is not null)
                : results.Where(a => a.ClaimedByRecruiterId is null);

        if (request.IsShortlisted is not null)
            results = request.IsShortlisted.Value
                ? results.Where(a => a.ShortlistedByRecruiterId is not null)
                : results.Where(a => a.ShortlistedByRecruiterId is null);

        if (request.FromDate is not null)
            results = results.Where(a => a.CreatedAt >= request.FromDate);

        if (request.ToDate is not null)
            results = results.Where(a => a.CreatedAt <= request.ToDate);

        return Task.FromResult(results.ToList());
    }
}