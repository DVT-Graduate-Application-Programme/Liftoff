using Domain.Entities;
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public interface IApplicationEvaluationService
{
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
}
