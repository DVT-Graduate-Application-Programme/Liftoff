using System.Text.Json.Serialization;
using MediatR;

namespace Application.Features.IngestEvaluation;

public class IngestEvaluationCommand : IRequest<IngestEvaluationResult>
{
    [JsonPropertyName("application_id")]
    public string ApplicationId { get; set; } = string.Empty;

    [JsonPropertyName("scores")]
    public EvaluationScoresDto Scores { get; set; } = new();

    [JsonPropertyName("bonus_points")]
    public BonusPointsDto BonusPoints { get; set; } = new();

    [JsonPropertyName("prompt_injection_detected")]
    public bool PromptInjectionDetected { get; set; }

    [JsonPropertyName("prompt_injection_evidence")]
    public string PromptInjectionEvidence { get; set; } = string.Empty;

    [JsonPropertyName("key_strengths")]
    public List<string> KeyStrengths { get; set; } = [];

    [JsonPropertyName("areas_for_improvement")]
    public List<string> AreasForImprovement { get; set; } = [];

    [JsonPropertyName("institution")]
    public InstitutionDto? Institution { get; set; }
}

public class InstitutionDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("degreeName")]
    public string DegreeName { get; set; } = string.Empty;

    [JsonPropertyName("degree_name")]
    public string DegreeNameSnake { get; set; } = string.Empty;

    [JsonPropertyName("academicAverage")]
    public double AcademicAverage { get; set; }

    [JsonPropertyName("academic_average")]
    public double AcademicAverageSnake { get; set; }
}

public class EvaluationScoresDto
{
    [JsonPropertyName("education")]
    public EducationScoreDto Education { get; set; } = new();

    [JsonPropertyName("open_source")]
    public ScoreCategoryDto OpenSource { get; set; } = new();

    [JsonPropertyName("self_projects")]
    public ScoreCategoryDto SelfProjects { get; set; } = new();

    [JsonPropertyName("production")]
    public ScoreCategoryDto Production { get; set; } = new();

    [JsonPropertyName("technical_skills")]
    public ScoreCategoryDto TechnicalSkills { get; set; } = new();
}

public class ScoreCategoryDto
{
    [JsonPropertyName("score")]
    public float Score { get; set; }

    [JsonPropertyName("max")]
    public float Max { get; set; }

    [JsonPropertyName("evidence")]
    public string Evidence { get; set; } = string.Empty;
}

public class EducationScoreDto : ScoreCategoryDto
{
    [JsonPropertyName("track")]
    public string Track { get; set; } = string.Empty;

    [JsonPropertyName("academic_requirement_met")]
    public string AcademicRequirementMet { get; set; } = string.Empty;

    [JsonPropertyName("experience_requirement_met")]
    public string ExperienceRequirementMet { get; set; } = string.Empty;
}

public class BonusPointsDto
{
    [JsonPropertyName("total")]
    public float Total { get; set; }

    [JsonPropertyName("breakdown")]
    public string Breakdown { get; set; } = string.Empty;
}
