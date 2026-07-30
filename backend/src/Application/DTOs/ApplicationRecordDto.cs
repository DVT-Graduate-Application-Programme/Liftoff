using System;
using System.Text.Json;

namespace Application.DTOs;

public class ApplicationRecordDto
{
    public Guid Id { get; set; }
    public string EmailMessageId { get; set; } = string.Empty;
    public string? CandidateName { get; set; }
    public string? CandidateEmail { get; set; }
    public string? CandidateGitHubUrl { get; set; }
    public string? CvAttachmentId { get; set; }
    public string? TranscriptAttachmentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Tier { get; set; }
    public bool? HardGatePassed { get; set; }
    public string? HardGateReason { get; set; }
    public decimal? HiringAgentTotalScore { get; set; }
    public string? HiringAgentExplanation { get; set; }
    public string? CvSummary { get; set; }
    public JsonDocument? FlagsJson { get; set; }
    public string? ClaimedByRecruiterId { get; set; }
    public DateTimeOffset? ClaimedAt { get; set; }
    public string? ShortlistedByRecruiterId { get; set; }
    public DateTimeOffset? ShortlistedAt { get; set; }
    public short? RecruiterRating { get; set; }
    public string? RecruiterRatingNote { get; set; }
    public string? RatedByRecruiterId { get; set; }
    public DateTimeOffset? RatedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
