using System;

namespace Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? ApplicationRecordId { get; set; }
    public string SourceService { get; set; } = string.Empty;
    public string LogLevel { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ExceptionDetails { get; set; }
    public DateTimeOffset Timestamp { get; set; }

    public ApplicationRecord? ApplicationRecord { get; set; }
}
