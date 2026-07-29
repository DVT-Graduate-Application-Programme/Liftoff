namespace Application.Features.GetDashboardMetrics;

public class DashboardMetricsDto
{
    public int TotalApplications { get; set; }
    public int PendingApplications { get; set; }
    public int ProcessingApplications { get; set; }
    public int ValidApplications { get; set; }
    public int InvalidApplications { get; set; }
    public int ManualReviewApplications { get; set; }
    public int ShortlistedApplications { get; set; }
    public int ErrorApplications { get; set; }
}