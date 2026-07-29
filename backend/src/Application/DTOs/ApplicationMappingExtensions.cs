using Domain.Entities;

namespace Application.DTOs;

public static class ApplicationMappingExtensions
{
    public static ApplicationRecordDto ToDto(this ApplicationRecord entity)
    {
        return new ApplicationRecordDto
        {
            Id = entity.Id,
            EmailMessageId = entity.EmailMessageId,
            CandidateName = entity.CandidateName,
            CandidateEmail = entity.CandidateEmail,
            CandidateGitHubUrl = entity.CandidateGitHubUrl,
            CvAttachmentId = entity.CvAttachmentId,
            TranscriptAttachmentId = entity.TranscriptAttachmentId,
            Status = entity.Status,
            Tier = entity.Tier,
            HardGatePassed = entity.HardGatePassed,
            HardGateReason = entity.HardGateReason,
            HiringAgentTotalScore = entity.HiringAgentTotalScore,
            HiringAgentExplanation = entity.HiringAgentExplanation,
            CvSummary = entity.CvSummary,
            FlagsJson = entity.FlagsJson,
            ClaimedByRecruiterId = entity.ClaimedByRecruiterId,
            ClaimedAt = entity.ClaimedAt,
            ShortlistedByRecruiterId = entity.ShortlistedByRecruiterId,
            ShortlistedAt = entity.ShortlistedAt,
            RecruiterRating = entity.RecruiterRating,
            RecruiterRatingNote = entity.RecruiterRatingNote,
            RatedByRecruiterId = entity.RatedByRecruiterId,
            RatedAt = entity.RatedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public static RecruiterDto ToDto(this Recruiter entity)
    {
        return new RecruiterDto
        {
            Id = entity.Id,
            IdentityId = entity.IdentityId,
            FirstName = entity.FirstName,
            LastName = entity.LastName,
            Email = entity.Email,
            FullName = entity.FullName,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
