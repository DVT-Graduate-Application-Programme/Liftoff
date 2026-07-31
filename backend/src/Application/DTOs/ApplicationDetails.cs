using Application.DTOs;
using Domain.Entities;

public class ApplicationDetails
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Tier { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public ICollection<HiringAgentEvaluationDto> HiringAgentEvaluations { get; set; } = new List<HiringAgentEvaluationDto>();
    public ICollection<RecruiterAction> RecruiterActions { get; set; } = new List<RecruiterAction>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}