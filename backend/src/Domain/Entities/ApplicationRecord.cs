using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Domain.Entities;

public class ApplicationRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();

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

public class Applicant
{
    public string? CandidateName { get; set; }
    public string? CandidateEmail { get; set; }
    public string? CandidateGitHubUrl { get; set; }
}

public class ApplicationDetails
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Tier { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public ICollection<HiringAgentEvaluation> HiringAgentEvaluations { get; set; } = new List<HiringAgentEvaluation>();
    public ICollection<RecruiterAction> RecruiterActions { get; set; } = new List<RecruiterAction>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}

public class ApplicationHardGateScreening
{
    public bool? HardGatePassed { get; set; }
    public string? HardGateReason { get; set; }
}

public class ApplicationOwnershipClaim
{
    public string ClaimedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset ClaimedAt { get; set; }
}

public class ApplicationOwnershipShortlist
{
    public string ShortlistedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset ShortlistedAt { get; set; }
    public string UpdatedStatus { get; set; } = string.Empty;
}

public class ApplicationOwnership
{
    public string? ClaimedByRecruiterId { get; set; }
    public DateTimeOffset? ClaimedAt { get; set; }
    public string? ShortlistedByRecruiterId { get; set; }
    public DateTimeOffset? ShortlistedAt { get; set; }
    public short? RecruiterRating { get; set; }
    public string? RecruiterRatingNote { get; set; }
    public string? RatedByRecruiterId { get; set; }
    public DateTimeOffset? RatedAt { get; set; }
}

public class ApplicationStatusUpdate
{
    public string ActionedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset ActionedAt { get; set; }
    public string UpdatedStatus { get; set; } = string.Empty;
}

public class ApplicationRatingUpdate
{
    public string RatedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset RatedAt { get; set; }
    public short? RecruiterRating { get; set; }
    public string? RecruiterRatingNote { get; set; }
}

public class RecruiterActionLogDto
{
    public Guid Id { get; set; }
    public Guid ApplicationRecordId { get; set; }
    public string RecruiterIdentity { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string? PreviousStatus { get; set; }
    public string? NewStatus { get; set; }
    public string? Reason { get; set; }
    public short? RatingValue { get; set; }
    public DateTimeOffset ActionedAt { get; set; }
}
