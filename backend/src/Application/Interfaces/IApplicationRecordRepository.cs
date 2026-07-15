using Domain.Entities;
using Application.Queries.GetDashboardApplications;
using Application.Queries.GetDashboardMetrics;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public interface IApplicationRecordRepository
{
    Task<List<ApplicationRecord>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApplicationRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApplicationRecord?> GetByEmailMessageIdAsync(string emailMessageId, CancellationToken cancellationToken = default);
    Task<Applicant?> GetApplicantByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApplicationDetails?> GetApplicationDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApplicationHardGateScreening?> GetHardGateScreeningByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HiringAgentEvaluation?> GetHardGateEvaluationByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApplicationOwnership?> GetOwnershipAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApplicationOwnershipClaim?> ClaimOwnershipAsync(Guid id, string recruiterIdentity, CancellationToken cancellationToken = default);
    Task<ApplicationOwnershipShortlist?> ShortlistAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationStatusUpdate?> AcceptAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationStatusUpdate?> RejectAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationRatingUpdate?> RateAsync(Guid id, string recruiterIdentity, short rating, string? notes, CancellationToken cancellationToken = default);
    Task<ApplicationRatingUpdate?> AddNotesAsync(Guid id, string recruiterIdentity, string notes, CancellationToken cancellationToken = default);
    Task<List<RecruiterActionLogDto>> GetRecruiterLogsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<RecruiterActionLogDto>> GetAllRecruiterLogsAsync(CancellationToken cancellationToken = default);
    Task<List<DashboardApplicationDto>> GetDashboardApplicationsAsync(GetDashboardApplicationsQuery query, CancellationToken cancellationToken = default);
    Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string emailMessageId, CancellationToken cancellationToken = default);
    Task AddAsync(ApplicationRecord record, CancellationToken cancellationToken = default);
    Task<bool> AddEvaluationAsync(
        Guid applicationId,
        HiringAgentEvaluation evaluation,
        string status,
        decimal totalScore,
        string tier,
        bool hardGatePassed,
        string hardGateReason,
        string? cvSummary,
        JsonDocument? flagsJson,
        CancellationToken cancellationToken = default);
    Task<bool> ResetEvaluationAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAuditLogAsync(AuditLog auditLog, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class ApplicationStatusUpdate
{
    public string ActionedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset ActionedAt { get; set; }
    public string UpdatedStatus { get; set; } = string.Empty;
}

public class ApplicationRatingUpdate
{
    public string RatedByRecruiterId { get; set; } = string.Empty;
    public DateTimeOffset RatedAt { get; set; }
    public short? RecruiterRating { get; set; }
    public string? RecruiterRatingNote { get; set; }
}

public class RecruiterActionLogDto
{
    public Guid Id { get; set; }
    public Guid ApplicationRecordId { get; set; }
    public string RecruiterIdentity { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string? PreviousStatus { get; set; }
    public string? NewStatus { get; set; }
    public string? Reason { get; set; }
    public short? RatingValue { get; set; }
    public DateTimeOffset ActionedAt { get; set; }
}
