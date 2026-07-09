using MediatR;

namespace Application.Commands.IngestEvaluation;

public class IngestEvaluationCommand : IRequest<IngestEvaluationResult>
{
    public string ApplicationId { get; set; } = string.Empty; 
    public EvaluationScoresDto Scores { get; set; } = new();
    public BonusPointsDto BonusPoints { get; set; } = new();
    public bool PromptInjectionDetected { get; set; }
    public string PromptInjectionEvidence { get; set; } = string.Empty;
    public List<string> KeyStrengths { get; set; } = [];
    public List<string> AreasForImprovement { get; set; } = [];
}

public class EvaluationScoresDto
{
    public EducationScoreDto Education { get; set; } = new();
    public ScoreCategoryDto OpenSource { get; set; } = new();
    public ScoreCategoryDto SelfProjects { get; set; } = new();
    public ScoreCategoryDto Production { get; set; } = new();
    public ScoreCategoryDto TechnicalSkills { get; set; } = new();
}

public class ScoreCategoryDto
{
    public int Score { get; set; }
    public int Max { get; set; }
    public string Evidence { get; set; } = string.Empty;
}

public class EducationScoreDto : ScoreCategoryDto
{
    public string Track { get; set; } = string.Empty;
    public string AcademicRequirementMet { get; set; } = string.Empty;
    public string ExperienceRequirementMet { get; set; } = string.Empty;
}

public class BonusPointsDto
{
    public int Total { get; set; }
    public string Breakdown { get; set; } = string.Empty;
}