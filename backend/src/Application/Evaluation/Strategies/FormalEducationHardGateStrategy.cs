using Application.Commands.IngestEvaluation;

namespace Application.Evaluation.Strategies;

public class FormalEducationHardGateStrategy : IHardGateEvaluationStrategy
{
    public bool CanEvaluate(string track)
    {
        var normalized = track.Trim().ToLowerInvariant();
        return normalized is "formal_it" or "related_field";
    }

    public HardGateResult Evaluate(EducationScoreDto education)
    {
        var academicRequirement = education.AcademicRequirementMet.Trim().ToLowerInvariant() ?? string.Empty;

        return academicRequirement switch
        {
            "met" => new HardGateResult(true, "Academic requirement met."),
            "unclear_needs_review" => new HardGateResult(false, "Academic requirement unclear; needs review."),
            _ => new HardGateResult(false, "Academic requirement not met.")
        };
    }
}
