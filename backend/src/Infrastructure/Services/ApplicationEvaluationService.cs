using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Services;

public class ApplicationEvaluationService : IApplicationEvaluationService
{
    private readonly GradRecruitmentDbContext _dbContext;
    private readonly IApplicationEventService _events;

    public ApplicationEvaluationService(
        GradRecruitmentDbContext dbContext,
        IApplicationEventService events)
    {
        _dbContext = dbContext;
        _events = events;
    }

    public async Task<bool> AddEvaluationAsync(
        Guid applicationId,
        HiringAgentEvaluation evaluation,
        string status,
        decimal totalScore,
        string tier,
        bool hardGatePassed,
        string hardGateReason,
        string? cvSummary,
        JsonDocument? flagsJson,
        CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords
            .FirstOrDefaultAsync(r => r.Id == applicationId, cancellationToken);

        if (applicationRecord is null)
        {
            return false;
        }

        evaluation.ApplicationRecordId = applicationId;

        applicationRecord.Status = status;
        applicationRecord.Tier = tier;
        applicationRecord.HardGatePassed = hardGatePassed;
        applicationRecord.HardGateReason = hardGateReason;
        applicationRecord.HiringAgentTotalScore = totalScore;
        applicationRecord.HiringAgentExplanation = cvSummary;
        applicationRecord.CvSummary = cvSummary;
        applicationRecord.FlagsJson = flagsJson;
        applicationRecord.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.HiringAgentEvaluations.AddAsync(evaluation, cancellationToken);
        _events.PublishEvaluationSaved(applicationId);
        return true;
    }

    public async Task<bool> ResetEvaluationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords
            .Include(r => r.HiringAgentEvaluations)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (applicationRecord is null)
        {
            return false;
        }

        // Remove any existing evaluations
        if (applicationRecord.HiringAgentEvaluations.Any())
        {
            _dbContext.HiringAgentEvaluations.RemoveRange(applicationRecord.HiringAgentEvaluations);
        }

        // Reset fields
        applicationRecord.Tier = null;
        applicationRecord.HardGatePassed = null;
        applicationRecord.HardGateReason = null;
        applicationRecord.HiringAgentTotalScore = null;
        applicationRecord.HiringAgentExplanation = null;
        applicationRecord.CvSummary = null;
        applicationRecord.FlagsJson = null;
        applicationRecord.Status = "PROCESSING";
        applicationRecord.UpdatedAt = DateTimeOffset.UtcNow;

        _events.PublishEvaluationReset(id);
        return true;
    }
}
