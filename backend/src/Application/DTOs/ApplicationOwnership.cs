public class ApplicationOwnership
{
    public string? ClaimedByRecruiterId { get; set; }
    public DateTimeOffset? ClaimedAt { get; set; }
    public string? ShortlistedByRecruiterId { get; set; }
    public DateTimeOffset? ShortlistedAt { get; set; }
    public short? RecruiterRating { get; set; }
    public string? RecruiterRatingNote { get; set; }
    public short? TechnicalRating { get; set; }
    public string? RatedByRecruiterId { get; set; }
    public DateTimeOffset? RatedAt { get; set; }
}