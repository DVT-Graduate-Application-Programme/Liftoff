using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Domain.Entities;

public class ApplicationRecord
{
    public Guid Id { get; set; }

    // Ingest fields
    public string EmailMessageId { get; set; } = string.Empty;
    public string? CandidateName { get; set; }
    public string? CandidateEmail { get; set; }
    public string? CandidateGitHubUrl { get; set; }
    public string? CvAttachmentId { get; set; }
    public string? TranscriptAttachmentId { get; set; }

    // Status and tier
    public string Status { get; set; } = string.Empty;
    public string? Tier { get; set; }

    // Hard gate screening
    public bool? HardGatePassed { get; set; }
    public string? HardGateReason { get; set; }

    // Hiring Agent evaluation summary (denormalised for dashboard card performance)
    public decimal? HiringAgentTotalScore { get; set; }
    public string? HiringAgentExplanation { get; set; }
    public string? CvSummary { get; set; }
    public JsonDocument? FlagsJson { get; set; }

    // Claim ownership
    public string? ClaimedByRecruiterId { get; set; }
    public DateTimeOffset? ClaimedAt { get; set; }

    // Shortlist ownership
    public string? ShortlistedByRecruiterId { get; set; }
    public DateTimeOffset? ShortlistedAt { get; set; }

    // Recruiter rating (denormalised for dashboard read performance)
    public short? RecruiterRating { get; set; }
    public string? RecruiterRatingNote { get; set; }
    public string? RatedByRecruiterId { get; set; }
    public DateTimeOffset? RatedAt { get; set; }

    // Timestamps
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<HiringAgentEvaluation> HiringAgentEvaluations { get; set; } = new List<HiringAgentEvaluation>();
    public ICollection<RecruiterAction> RecruiterActions { get; set; } = new List<RecruiterAction>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
