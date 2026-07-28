public class ApplicationOwnershipClaim
{
    public string ClaimedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset ClaimedAt { get; set; }
}