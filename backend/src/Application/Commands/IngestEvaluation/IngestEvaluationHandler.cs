using Application.Evaluation;
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
    private readonly IApplicationEvaluationService _evaluationService;
    private readonly IApplicationRecordRepository _repository;
    private readonly IHardGateEvaluator _hardGateEvaluator;

    public IngestEvaluationHandler(
        IApplicationEvaluationService evaluationService,
        IApplicationRecordRepository repository,
        IHardGateEvaluator hardGateEvaluator)
    {
        _evaluationService = evaluationService;
        _repository = repository;
        _hardGateEvaluator = hardGateEvaluator;
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

        var totalScore = DeriveTotalScore(request.Scores);

        InstitutionDto? institutionDto = null;
        if (request.Institution != null)
        {
            var degree = !string.IsNullOrEmpty(request.Institution.DegreeName)
                ? request.Institution.DegreeName
                : request.Institution.DegreeNameSnake;
            var average = request.Institution.AcademicAverage > 0
                ? request.Institution.AcademicAverage
                : request.Institution.AcademicAverageSnake;

            institutionDto = new InstitutionDto
            {
                Name = request.Institution.Name,
                DegreeName = degree,
                DegreeNameSnake = degree,
                AcademicAverage = average,
                AcademicAverageSnake = average
            };
        }

        var evaluation = new HiringAgentEvaluation
        {
            InstitutionJson = institutionDto != null ? ToJsonDocument(institutionDto) : null,
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

        var status = request.PromptInjectionDetected ? "MANUAL_REVIEW" : "PENDING";
        var tier = DeriveTier(totalScore.Score, totalScore.Max);
        var hardGate = _hardGateEvaluator.Evaluate(request.Scores.Education);
        var summary = BuildSummary(request, totalScore);
        var saved = await _evaluationService.AddEvaluationAsync(
            applicationId,
            evaluation,
            status,
            (decimal)totalScore.Score,
            tier,
            hardGate.Passed,
            hardGate.Reason,
            summary,
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

    private static string BuildSummary(IngestEvaluationCommand request, DerivedTotalScore totalScore)
    {
        if (request.KeyStrengths.Count == 0 && request.AreasForImprovement.Count == 0)
        {
            return $"Total score: {totalScore.Score}/{totalScore.Max}.";
        }

        var strengths = request.KeyStrengths.Count == 0
            ? "No key strengths supplied"
            : string.Join("; ", request.KeyStrengths);

        var improvements = request.AreasForImprovement.Count == 0
            ? "No improvement areas supplied"
            : string.Join("; ", request.AreasForImprovement);

        return $"Total score: {totalScore.Score}/{totalScore.Max}. Strengths: {strengths}. Improvements: {improvements}.";
    }

    private static DerivedTotalScore DeriveTotalScore(EvaluationScoresDto scores)
    {
        var categories = new ScoreCategoryDto[]
        {
            scores.Education,
            scores.OpenSource,
            scores.SelfProjects,
            scores.Production,
            scores.TechnicalSkills
        };

        return new DerivedTotalScore(
            categories.Sum(category => category.Score),
            categories.Sum(category => category.Max));
    }

    private static string DeriveTier(double score, double maxScore)
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

    private sealed record DerivedTotalScore(float Score, float Max);
}
