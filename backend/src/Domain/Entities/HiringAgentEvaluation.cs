using System;
using System.Text.Json.Serialization;

namespace Domain.Entities;

public class HiringAgentEvaluation
{
    public Guid Id { get; set; }
    public Guid ApplicationRecordId { get; set; }

    // Institution: { name, degreeName }
    public string? InstitutionJson { get; set; }

    // Per-category scores
    public string? CategoryScoresJson { get; set; }

    // Evidence per category
    public string? EvidenceJson { get; set; }

    // Bonus points
    public string? BonusPointsJson { get; set; }

    // Deductions
    public string? DeductionsJson { get; set; }

    // Human-readable strengths and improvement areas
    public string? KeyStrengthsJson { get; set; }
    public string? AreasForImprovementJson { get; set; }

    // Raw GitHub and project classification data
    public string? GitHubProfileDataJson { get; set; }
    public string? ProjectClassificationsJson { get; set; }

    public string? AiSummary { get; set; }

    public DateTimeOffset ProcessedAt { get; set; }

    [JsonIgnore]
    public ApplicationRecord? ApplicationRecord { get; set; }
}
