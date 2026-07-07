using System;

namespace Domain.Entities;

public class RecruiterAction
{
    public Guid Id { get; set; }
    public Guid ApplicationRecordId { get; set; }
    public string RecruiterIdentity { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string? PreviousStatus { get; set; }
    public string? NewStatus { get; set; }
    public string? Reason { get; set; }
    public DateTimeOffset ActionedAt { get; set; }

    public ApplicationRecord? ApplicationRecord { get; set; }
}
