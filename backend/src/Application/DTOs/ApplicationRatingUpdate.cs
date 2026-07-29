public class ApplicationRatingUpdate
{
    public string RatedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset RatedAt { get; set; }
    public short? RecruiterRating { get; set; }
    public string? RecruiterRatingNote { get; set; }
}