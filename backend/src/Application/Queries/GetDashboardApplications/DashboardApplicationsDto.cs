namespace Application.Queries.GetDashboardApplications;
 
public class DashboardApplicationDto
{
    public string ApplicationId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public bool HardGatePassed { get; set; }
    public double HiringAgentTotalScore { get; set; }
    public string CvSummary { get; set; } = string.Empty;
    public List<string> Flags { get; set; } = [];
    public string? CandidateGitHubUrl { get; set; }
    public string? ClaimedByRecruiterId { get; set; }
    public string? ShortlistedByRecruiterId { get; set; }
    public int? RecruiterRating { get; set; }
    public double? AcademicAverage { get; set; }
    public DateTime CreatedAt { get; set; }
}