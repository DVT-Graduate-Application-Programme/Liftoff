using MediatR;

namespace Application.Queries.GetDashboardApplications;

public class GetDashboardApplicationsQuery : IRequest<List<DashboardApplicationDto>>
{
    public string? Status { get; set; }
    public string? Tier { get; set; }
    public bool? HardGatePassed { get; set; }
    public bool? IsClaimed { get; set; }
    public bool? IsShortlisted { get; set; }
    public string? RecruiterIdentity { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
