using System;
using System.Collections.Generic;
using System.Text.Json;
using Domain.Enums;

namespace Domain.Entities;

public class ApplicationRecord
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    // Ingest fields
    public string EmailMessageId { get; private set; } = string.Empty;
    public string? CandidateName { get; private set; }
    public string? CandidateEmail { get; private set; }
    public string? CandidateGitHubUrl { get; private set; }
    public string? CvAttachmentId { get; private set; }
    public string? TranscriptAttachmentId { get; private set; }

    // Status and tier
    public string Status { get; private set; } = string.Empty;
    public string? Tier { get; private set; }

    // Hard gate screening
    public bool? HardGatePassed { get; private set; }
    public string? HardGateReason { get; private set; }

    // Hiring Agent evaluation summary (denormalised for dashboard card performance)
    public decimal? HiringAgentTotalScore { get; private set; }
    public string? HiringAgentExplanation { get; private set; }
    public string? CvSummary { get; private set; }
    public JsonDocument? FlagsJson { get; private set; }

    // Claim ownership
    public string? ClaimedByRecruiterId { get; private set; }
    public DateTimeOffset? ClaimedAt { get; private set; }

    // Shortlist ownership
    public string? ShortlistedByRecruiterId { get; private set; }
    public DateTimeOffset? ShortlistedAt { get; private set; }

    // Recruiter rating (denormalised for dashboard read performance)
    public short? RecruiterRating { get; private set; }
    public string? RecruiterRatingNote { get; private set; }
    public string? RatedByRecruiterId { get; private set; }
    public DateTimeOffset? RatedAt { get; private set; }

    // Timestamps
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    // Navigation properties
    public ICollection<HiringAgentEvaluation> HiringAgentEvaluations { get; private set; } = new List<HiringAgentEvaluation>();
    public ICollection<RecruiterAction> RecruiterActions { get; private set; } = new List<RecruiterAction>();
    public ICollection<AuditLog> AuditLogs { get; private set; } = new List<AuditLog>();

    public ApplicationRecord()
    {
    }

    public ApplicationRecord(
        Guid id,
        string emailMessageId,
        string? candidateName = null,
        string? candidateEmail = null,
        string? candidateGitHubUrl = null,
        string? status = null,
        string? tier = null,
        bool? hardGatePassed = null,
        string? hardGateReason = null,
        string? claimedByRecruiterId = null,
        DateTimeOffset? claimedAt = null,
        string? shortlistedByRecruiterId = null,
        DateTimeOffset? shortlistedAt = null,
        short? recruiterRating = null,
        string? recruiterRatingNote = null,
        string? ratedByRecruiterId = null,
        DateTimeOffset? ratedAt = null,
        decimal? hiringAgentTotalScore = null,
        string? hiringAgentExplanation = null,
        string? cvSummary = null,
        JsonDocument? flagsJson = null,
        DateTimeOffset? createdAt = null,
        DateTimeOffset? updatedAt = null,
        string? cvAttachmentId = null,
        string? transcriptAttachmentId = null)
    {
        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        EmailMessageId = emailMessageId;
        CandidateName = candidateName;
        CandidateEmail = candidateEmail;
        CandidateGitHubUrl = candidateGitHubUrl;
        Status = status ?? ApplicationStatus.PENDING.ToString();
        Tier = tier;
        HardGatePassed = hardGatePassed;
        HardGateReason = hardGateReason;
        ClaimedByRecruiterId = claimedByRecruiterId;
        ClaimedAt = claimedAt;
        ShortlistedByRecruiterId = shortlistedByRecruiterId;
        ShortlistedAt = shortlistedAt;
        RecruiterRating = recruiterRating;
        RecruiterRatingNote = recruiterRatingNote;
        RatedByRecruiterId = ratedByRecruiterId;
        RatedAt = ratedAt;
        HiringAgentTotalScore = hiringAgentTotalScore;
        HiringAgentExplanation = hiringAgentExplanation;
        CvSummary = cvSummary;
        FlagsJson = flagsJson;
        CreatedAt = createdAt ?? DateTimeOffset.UtcNow;
        UpdatedAt = updatedAt ?? CreatedAt;
        CvAttachmentId = cvAttachmentId;
        TranscriptAttachmentId = transcriptAttachmentId;
    }

    public static ApplicationRecord Create(
        string emailMessageId,
        string? candidateEmail = null,
        string? candidateName = null,
        string? candidateGitHubUrl = null,
        string? status = null,
        DateTimeOffset? timestamp = null)
    {
        var now = timestamp ?? DateTimeOffset.UtcNow;
        return new ApplicationRecord(
            id: Guid.NewGuid(),
            emailMessageId: emailMessageId,
            candidateName: candidateName,
            candidateEmail: candidateEmail,
            candidateGitHubUrl: candidateGitHubUrl,
            status: status ?? ApplicationStatus.PENDING.ToString(),
            createdAt: now,
            updatedAt: now
        );
    }

    // Domain Methods

    public void ClaimOwnership(string recruiterId, DateTimeOffset? timestamp = null)
    {
        if (string.IsNullOrWhiteSpace(recruiterId))
        {
            throw new ArgumentException("Recruiter identity is required to claim ownership.", nameof(recruiterId));
        }

        var now = timestamp ?? DateTimeOffset.UtcNow;
        ClaimedByRecruiterId = recruiterId;
        ClaimedAt = now;
        UpdatedAt = now;

        RecruiterActions.Add(new RecruiterAction
        {
            ApplicationRecordId = Id,
            RecruiterIdentity = recruiterId,
            ActionType = "CLAIM",
            ActionedAt = now
        });

        AuditLogs.Add(new AuditLog
        {
            ApplicationRecordId = Id,
            SourceService = "ApplicationRecordDomain",
            LogLevel = "Information",
            Message = $"Ownership claimed by recruiter '{recruiterId}'.",
            Timestamp = now
        });
    }

    public void Shortlist(string recruiterId, string? reason = null, DateTimeOffset? timestamp = null)
    {
        if (string.IsNullOrWhiteSpace(recruiterId))
        {
            throw new ArgumentException("Recruiter identity is required to shortlist.", nameof(recruiterId));
        }

        var now = timestamp ?? DateTimeOffset.UtcNow;
        var previousStatus = Status;
        var shortlistedStatus = ApplicationStatus.SHORTLISTED.ToString();

        ShortlistedByRecruiterId = recruiterId;
        ShortlistedAt = now;
        Status = shortlistedStatus;
        UpdatedAt = now;

        RecruiterActions.Add(new RecruiterAction
        {
            ApplicationRecordId = Id,
            RecruiterIdentity = recruiterId,
            ActionType = "SHORTLIST",
            PreviousStatus = previousStatus,
            NewStatus = shortlistedStatus,
            Reason = reason,
            ActionedAt = now
        });

        AuditLogs.Add(new AuditLog
        {
            ApplicationRecordId = Id,
            SourceService = "ApplicationRecordDomain",
            LogLevel = "Information",
            Message = $"Application shortlisted by recruiter '{recruiterId}'.",
            Timestamp = now
        });
    }

    public void UpdateStatus(string recruiterId, string newStatus, string? reason = null, DateTimeOffset? timestamp = null)
    {
        if (string.IsNullOrWhiteSpace(recruiterId))
        {
            throw new ArgumentException("Recruiter identity is required to update status.", nameof(recruiterId));
        }

        if (string.IsNullOrWhiteSpace(newStatus))
        {
            throw new ArgumentException("New status is required.", nameof(newStatus));
        }

        var now = timestamp ?? DateTimeOffset.UtcNow;
        var previousStatus = Status;

        Status = newStatus;
        UpdatedAt = now;

        if (newStatus == ApplicationStatus.REJECTED.ToString())
        {
            ShortlistedByRecruiterId = null;
            ShortlistedAt = null;
        }

        RecruiterActions.Add(new RecruiterAction
        {
            ApplicationRecordId = Id,
            RecruiterIdentity = recruiterId,
            ActionType = "STATUS_OVERRIDE",
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Reason = reason,
            ActionedAt = now
        });

        AuditLogs.Add(new AuditLog
        {
            ApplicationRecordId = Id,
            SourceService = "ApplicationRecordDomain",
            LogLevel = "Information",
            Message = $"Status updated from '{previousStatus}' to '{newStatus}' by recruiter '{recruiterId}'.",
            Timestamp = now
        });
    }

    public void Accept(string recruiterId, string? reason = null, DateTimeOffset? timestamp = null)
    {
        UpdateStatus(recruiterId, ApplicationStatus.ACCEPTED.ToString(), reason, timestamp);
    }

    public void Reject(string recruiterId, string? reason = null, DateTimeOffset? timestamp = null)
    {
        UpdateStatus(recruiterId, ApplicationStatus.REJECTED.ToString(), reason, timestamp);
    }

    public void Rate(short rating, string? note, string recruiterId, DateTimeOffset? timestamp = null)
    {
        if (string.IsNullOrWhiteSpace(recruiterId))
        {
            throw new ArgumentException("Recruiter identity is required to rate.", nameof(recruiterId));
        }

        if (rating < 1 || rating > 5)
        {
            throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 1 and 5.");
        }

        var now = timestamp ?? DateTimeOffset.UtcNow;

        RecruiterRating = rating;
        if (note is not null || RecruiterRatingNote is null)
        {
            RecruiterRatingNote = note;
        }
        RatedByRecruiterId = recruiterId;
        RatedAt = now;
        UpdatedAt = now;

        RecruiterActions.Add(new RecruiterAction
        {
            ApplicationRecordId = Id,
            RecruiterIdentity = recruiterId,
            ActionType = "RATING",
            RatingValue = rating,
            Reason = note,
            ActionedAt = now
        });

        AuditLogs.Add(new AuditLog
        {
            ApplicationRecordId = Id,
            SourceService = "ApplicationRecordDomain",
            LogLevel = "Information",
            Message = $"Rated {rating}/5 by recruiter '{recruiterId}'.",
            Timestamp = now
        });
    }

    public void AddNote(string note, string recruiterId, DateTimeOffset? timestamp = null)
    {
        if (string.IsNullOrWhiteSpace(recruiterId))
        {
            throw new ArgumentException("Recruiter identity is required to add notes.", nameof(recruiterId));
        }

        var now = timestamp ?? DateTimeOffset.UtcNow;

        RecruiterRatingNote = note;
        UpdatedAt = now;

        RecruiterActions.Add(new RecruiterAction
        {
            ApplicationRecordId = Id,
            RecruiterIdentity = recruiterId,
            ActionType = "RATING",
            RatingValue = RecruiterRating,
            Reason = note,
            ActionedAt = now
        });

        AuditLogs.Add(new AuditLog
        {
            ApplicationRecordId = Id,
            SourceService = "ApplicationRecordDomain",
            LogLevel = "Information",
            Message = $"Note added by recruiter '{recruiterId}'.",
            Timestamp = now
        });
    }

    public void ApplyEvaluation(
        string status,
        string tier,
        bool hardGatePassed,
        string hardGateReason,
        decimal totalScore,
        string? cvSummary,
        JsonDocument? flagsJson,
        DateTimeOffset? timestamp = null)
    {
        var now = timestamp ?? DateTimeOffset.UtcNow;

        Status = status;
        Tier = tier;
        HardGatePassed = hardGatePassed;
        HardGateReason = hardGateReason;
        HiringAgentTotalScore = totalScore;
        HiringAgentExplanation = cvSummary;
        CvSummary = cvSummary;
        FlagsJson = flagsJson;
        UpdatedAt = now;

        AuditLogs.Add(new AuditLog
        {
            ApplicationRecordId = Id,
            SourceService = "HiringAgentEvaluation",
            LogLevel = "Information",
            Message = $"Evaluation applied: Score={totalScore}, Tier={tier}, Status={status}.",
            Timestamp = now
        });
    }

    public void ResetEvaluation(DateTimeOffset? timestamp = null)
    {
        var now = timestamp ?? DateTimeOffset.UtcNow;

        Tier = null;
        HardGatePassed = null;
        HardGateReason = null;
        HiringAgentTotalScore = null;
        HiringAgentExplanation = null;
        CvSummary = null;
        FlagsJson = null;
        Status = ApplicationStatus.PROCESSING.ToString();
        UpdatedAt = now;

        HiringAgentEvaluations.Clear();

        AuditLogs.Add(new AuditLog
        {
            ApplicationRecordId = Id,
            SourceService = "HiringAgentEvaluation",
            LogLevel = "Information",
            Message = "Evaluation reset for reevaluation.",
            Timestamp = now
        });
    }

    public void SetCvAttachment(string attachmentId)
    {
        CvAttachmentId = attachmentId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetTranscriptAttachment(string attachmentId)
    {
        TranscriptAttachmentId = attachmentId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

