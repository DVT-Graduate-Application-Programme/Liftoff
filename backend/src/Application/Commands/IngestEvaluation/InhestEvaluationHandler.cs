using Application.Interfaces;
using Domain.Entities;
using MediatR;
using System.Text.Json;

namespace Application.Commands.IngestEvaluation;

public class IngestEvaluationResult
{
    public bool Accepted { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class IngestEvaluationHandler
    : IRequestHandler<IngestEvaluationCommand, IngestEvaluationResult>
{
    private readonly IApplicationRecordRepository _repository;

    public IngestEvaluationHandler(IApplicationRecordRepository repository)
    {
        _repository = repository;
    }

    public async Task<IngestEvaluationResult> Handle(
        IngestEvaluationCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.ApplicationId, out var applicationId))
        {
            return new IngestEvaluationResult
            {
                Accepted = false,
                Message = $"ApplicationId '{request.ApplicationId}' is not a valid GUID."
            };
        }

        var evaluation = new HiringAgentEvaluation
        {
            CategoryScoresJson = ToJsonDocument(request.Scores),
            EvidenceJson = ToJsonDocument(BuildEvidence(request.Scores)),
            BonusPointsJson = ToJsonDocument(request.BonusPoints),
            DeductionsJson = ToJsonDocument(new
            {
                promptInjectionDetected = request.PromptInjectionDetected,
                promptInjectionEvidence = request.PromptInjectionEvidence
            }),
            KeyStrengthsJson = ToJsonDocument(request.KeyStrengths),
            AreasForImprovementJson = ToJsonDocument(request.AreasForImprovement),
            ProcessedAt = DateTimeOffset.UtcNow
        };

        var flags = request.PromptInjectionDetected
            ? new[] { "Prompt injection detected" }
            : [];

        var status = request.PromptInjectionDetected ? "MANUAL_REVIEW" : "VALID";
        var tier = DeriveTier(request.Scores.Total.Score, request.Scores.Total.Max);
        var saved = await _repository.AddEvaluationAsync(
            applicationId,
            evaluation,
            status,
            (decimal)request.Scores.Total.Score,
            tier,
            BuildSummary(request),
            ToJsonDocument(flags),
            cancellationToken);

        if (!saved)
        {
            return new IngestEvaluationResult
            {
                Accepted = false,
                Message = $"Application '{request.ApplicationId}' was not found."
            };
        }

        await _repository.SaveChangesAsync(cancellationToken);

        return new IngestEvaluationResult
        {
            Accepted = true,
            Message = $"Evaluation received and saved for application '{request.ApplicationId}'."
        };
    }

    private static JsonDocument ToJsonDocument<T>(T value)
    {
        return JsonDocument.Parse(JsonSerializer.Serialize(value));
    }

    private static object BuildEvidence(EvaluationScoresDto scores)
    {
        return new
        {
            education = scores.Education.Evidence,
            openSource = scores.OpenSource.Evidence,
            selfProjects = scores.SelfProjects.Evidence,
            production = scores.Production.Evidence,
            technicalSkills = scores.TechnicalSkills.Evidence
        };
    }

    private static string BuildSummary(IngestEvaluationCommand request)
    {
        if (request.KeyStrengths.Count == 0 && request.AreasForImprovement.Count == 0)
        {
            return $"Total score: {request.Scores.Total.Score}/{request.Scores.Total.Max}.";
        }

        var strengths = request.KeyStrengths.Count == 0
            ? "No key strengths supplied"
            : string.Join("; ", request.KeyStrengths);

        var improvements = request.AreasForImprovement.Count == 0
            ? "No improvement areas supplied"
            : string.Join("; ", request.AreasForImprovement);

        return $"Total score: {request.Scores.Total.Score}/{request.Scores.Total.Max}. Strengths: {strengths}. Improvements: {improvements}.";
    }

    private static string DeriveTier(double score, int maxScore)
    {
        if (score <= 0 || maxScore <= 0)
        {
            return "INVALID";
        }

        var percentage = score / maxScore * 100;

        return percentage switch
        {
            >= 50 => "STRONG",
            >= 35 => "BORDERLINE",
            _ => "WEAK"
        };
    }
}
