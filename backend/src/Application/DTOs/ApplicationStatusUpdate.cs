public class ApplicationStatusUpdate
{
    public string ActionedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset ActionedAt { get; set; }
    public string UpdatedStatus { get; set; } = string.Empty;
}