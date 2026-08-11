using Domain.Entities;
using System.Text.Json;

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
            TechnicalRating = entity.TechnicalRating,
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

    public static HiringAgentEvaluationDto ToDto(this HiringAgentEvaluation entity)
    {
        return new HiringAgentEvaluationDto
        {
            Id = entity.Id,
            ApplicationRecordId = entity.ApplicationRecordId,
            InstitutionJson = ParseJson(entity.InstitutionJson),
            CategoryScoresJson = ParseJson(entity.CategoryScoresJson),
            EvidenceJson = ParseJson(entity.EvidenceJson),
            BonusPointsJson = ParseJson(entity.BonusPointsJson),
            DeductionsJson = ParseJson(entity.DeductionsJson),
            KeyStrengthsJson = ParseJson(entity.KeyStrengthsJson),
            AreasForImprovementJson = ParseJson(entity.AreasForImprovementJson),
            GitHubProfileDataJson = ParseJson(entity.GitHubProfileDataJson),
            ProjectClassificationsJson = ParseJson(entity.ProjectClassificationsJson),
            AiSummary = entity.AiSummary,
            ProcessedAt = entity.ProcessedAt
        };
    }

    /// <summary>
    /// Parses a stored jsonb column into a JsonElement.
    ///
    /// Returns null for absent or malformed JSON rather than throwing: every one of these
    /// fields is already nullable on the wire, and one unparseable row must not fail the
    /// whole request. RootElement is cloned because the JsonDocument is disposed here.
    /// </summary>
    private static JsonElement? ParseJson(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(raw);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
