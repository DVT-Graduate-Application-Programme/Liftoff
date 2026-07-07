using System;
using System.Collections.Generic;

namespace Domain.Entities;

public class ApplicationRecord
{
    public Guid Id { get; set; }
    public string EmailMessageId { get; set; } = string.Empty;
    public string? CandidateName { get; set; }
    public string? CandidateEmail { get; set; }
    public string? CvAttachmentId { get; set; }
    public string? TranscriptAttachmentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool? HardGatePassed { get; set; }
    public string? HardGateReason { get; set; }
    public decimal? HiringAgentTotalScore { get; set; }
    public string? HiringAgentExplanation { get; set; }
    public string? CandidateGitHubUrl { get; set; }
    public string? ClaimedByRecruiterId { get; set; }
    public DateTimeOffset? ClaimedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    
    public ICollection<HiringAgentEvaluation> HiringAgentEvaluations { get; set; } = new List<HiringAgentEvaluation>();
    public ICollection<RecruiterAction> RecruiterActions { get; set; } = new List<RecruiterAction>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
