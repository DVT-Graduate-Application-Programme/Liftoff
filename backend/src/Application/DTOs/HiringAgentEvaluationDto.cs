using System;
using System.Text.Json;

namespace Application.DTOs;

/// <summary>
/// Wire shape for a hiring-agent evaluation.
///
/// HiringAgentEvaluation holds each of these columns as raw jsonb text, so serialising
/// the entity directly emits them as escaped strings — "{\"education\": ...}" — instead
/// of objects. Clients then read a property off a string, get undefined, and break.
///
/// Parsing to JsonElement here restores the nested shape callers expect while leaving
/// Domain free of System.Text.Json types.
/// </summary>
public class HiringAgentEvaluationDto
{
    public Guid Id { get; set; }
    public Guid ApplicationRecordId { get; set; }
    public JsonElement? InstitutionJson { get; set; }
    public JsonElement? CategoryScoresJson { get; set; }
    public JsonElement? EvidenceJson { get; set; }
    public JsonElement? BonusPointsJson { get; set; }
    public JsonElement? DeductionsJson { get; set; }
    public JsonElement? KeyStrengthsJson { get; set; }
    public JsonElement? AreasForImprovementJson { get; set; }
    public JsonElement? GitHubProfileDataJson { get; set; }
    public JsonElement? ProjectClassificationsJson { get; set; }
    public string? AiSummary { get; set; }
    public DateTimeOffset ProcessedAt { get; set; }
}
