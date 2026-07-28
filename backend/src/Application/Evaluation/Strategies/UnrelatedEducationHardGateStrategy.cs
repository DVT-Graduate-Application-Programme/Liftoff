using Application.Commands.IngestEvaluation;

namespace Application.Evaluation.Strategies;

public class UnrelatedEducationHardGateStrategy : IHardGateEvaluationStrategy
{
    public bool CanEvaluate(string track)
    {
        return track.Trim()?.ToLowerInvariant() == "unrelated";
    }

    public HardGateResult Evaluate(EducationScoreDto education)
    {
        return new HardGateResult(false, "Education track is unrelated.");
    }
}
