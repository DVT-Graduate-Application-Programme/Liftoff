using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Domain.Entities;

public class HiringAgentEvaluation
{
    public Guid Id { get; set; }
    public Guid ApplicationRecordId { get; set; }

    // The overall AI-generated summary
    public string? AiSummary { get; set; }

    // Institution: { name, degreeName }
    public JsonDocument? InstitutionJson { get; set; }

    // Per-category scores
    public JsonDocument? CategoryScoresJson { get; set; }

    // Evidence per category
    public JsonDocument? EvidenceJson { get; set; }

    // Bonus points
    public JsonDocument? BonusPointsJson { get; set; }

    // Deductions
    public JsonDocument? DeductionsJson { get; set; }

    // Human-readable strengths and improvement areas
    public JsonDocument? KeyStrengthsJson { get; set; }
    public JsonDocument? AreasForImprovementJson { get; set; }

    // Raw GitHub and project classification data
    public JsonDocument? GitHubProfileDataJson { get; set; }
    public JsonDocument? ProjectClassificationsJson { get; set; }

    public string? AiSummary { get; set; }

    public DateTimeOffset ProcessedAt { get; set; }

    [JsonIgnore]
    public ApplicationRecord? ApplicationRecord { get; set; }
}
