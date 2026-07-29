using Application.Features.IngestEvaluation;

namespace Application.Evaluation.Strategies;

public class SelfTaughtHardGateStrategy : IHardGateEvaluationStrategy
{
    public bool CanEvaluate(string track)
    {
        return track.Trim().ToLowerInvariant() == "self_taught";
    }

    public HardGateResult Evaluate(EducationScoreDto education)
    {
        var experienceRequirement = education.ExperienceRequirementMet.Trim().ToLowerInvariant() ?? string.Empty;

        return experienceRequirement switch
        {
            "met" => new HardGateResult(true, "Experience requirement met."),
            "unclear_needs_review" => new HardGateResult(false, "Experience requirement unclear; needs review."),
            _ => new HardGateResult(false, "Experience requirement not met.")
        };
    }
}
