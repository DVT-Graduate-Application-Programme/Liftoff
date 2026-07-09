using MediatR;
using Application.Queries.GetDashboardApplications;

namespace Application.Queries.GetDashboardMetrics;

public class GetDashboardMetricsHandler
    : IRequestHandler<GetDashboardMetricsQuery, DashboardMetricsDto>
{
    private readonly IRequestHandler<GetDashboardApplicationsQuery, List<DashboardApplicationDto>> _applicationsHandler;

    public GetDashboardMetricsHandler(
        IRequestHandler<GetDashboardApplicationsQuery, List<DashboardApplicationDto>> applicationsHandler)
    {
        _applicationsHandler = applicationsHandler;
    }

    public async Task<DashboardMetricsDto> Handle(
        GetDashboardMetricsQuery request,
        CancellationToken cancellationToken)
    {
        var all = await _applicationsHandler.Handle(
            new GetDashboardApplicationsQuery(),
            cancellationToken);

        return new DashboardMetricsDto
        {
            TotalApplications        = all.Count,
            PendingApplications      = all.Count(a => a.CurrentStatus == "PENDING"),
            ProcessingApplications   = all.Count(a => a.CurrentStatus == "PROCESSING"),
            ValidApplications        = all.Count(a => a.CurrentStatus == "VALID"),
            InvalidApplications      = all.Count(a => a.CurrentStatus == "INVALID"),
            ManualReviewApplications = all.Count(a => a.CurrentStatus == "MANUAL_REVIEW"),
            ShortlistedApplications  = all.Count(a => a.CurrentStatus == "SHORTLISTED"),
            ErrorApplications        = all.Count(a => a.CurrentStatus == "ERROR")
        };
    }
}