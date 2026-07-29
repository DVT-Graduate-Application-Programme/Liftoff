using System;
using System.Text.Json.Serialization;

namespace Domain.Entities;

public class RecruiterAction
{
    public Guid Id { get; set; }
    public Guid ApplicationRecordId { get; set; }
    public string RecruiterIdentity { get; set; } = string.Empty;

    // ActionType values: CLAIM | SHORTLIST | RATING | STATUS_OVERRIDE | FORWARD
    public string ActionType { get; set; } = string.Empty;

    // Status transition fields (used when ActionType = STATUS_OVERRIDE)
    public string? PreviousStatus { get; set; }
    public string? NewStatus { get; set; }

    // Optional justification
    public string? Reason { get; set; }

    // Rating value (used when ActionType = RATING; 1–5)
    public short? RatingValue { get; set; }

    public DateTimeOffset ActionedAt { get; set; }

    [JsonIgnore]
    public ApplicationRecord? ApplicationRecord { get; set; }
}
