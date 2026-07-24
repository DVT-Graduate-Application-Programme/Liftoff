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
    Task<ApplicationOwnershipClaim?> ClaimOwnershipAsync(Guid id, string recruiterIdentity, CancellationToken cancellationToken = default);
    Task<ApplicationOwnershipShortlist?> ShortlistAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationStatusUpdate?> AcceptAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationStatusUpdate?> RejectAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default);
    Task<ApplicationRatingUpdate?> RateAsync(Guid id, string recruiterIdentity, short rating, string? notes, CancellationToken cancellationToken = default);
    Task<ApplicationRatingUpdate?> AddNotesAsync(Guid id, string recruiterIdentity, string notes, CancellationToken cancellationToken = default);


    Task<bool> ExistsAsync(string emailMessageId, CancellationToken cancellationToken = default);
    Task AddAsync(ApplicationRecord record, CancellationToken cancellationToken = default);
    Task<List<Recruiter>> GetRecruitersAsync(CancellationToken cancellationToken = default);
    Task AddRecruiterAsync(RecruiterPostDto recruiter, CancellationToken cancellationToken = default);
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

