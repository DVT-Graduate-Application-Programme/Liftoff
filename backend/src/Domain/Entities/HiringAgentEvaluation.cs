using System;
using System.Text.Json;

namespace Domain.Entities;

public class HiringAgentEvaluation
{
    public Guid Id { get; set; }
    public Guid ApplicationRecordId { get; set; }
    public JsonDocument? CategoryScoresJson { get; set; }
    public JsonDocument? EvidenceJson { get; set; }
    public JsonDocument? BonusPointsJson { get; set; }
    public JsonDocument? DeductionsJson { get; set; }
    public JsonDocument? GitHubProfileDataJson { get; set; }
    public JsonDocument? ProjectClassificationsJson { get; set; }
    public DateTimeOffset ProcessedAt { get; set; }

    public ApplicationRecord? ApplicationRecord { get; set; }
}
