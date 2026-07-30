using Application.Features.IngestEvaluation;
using System.Collections.Generic;
using System.Linq;

namespace Application.Evaluation;

public class HardGateEvaluator : IHardGateEvaluator
{
    private readonly IEnumerable<IHardGateEvaluationStrategy> _strategies;

    public HardGateEvaluator(IEnumerable<IHardGateEvaluationStrategy> strategies)
    {
        _strategies = strategies;
    }

    public HardGateResult Evaluate(EducationScoreDto education)
    {
        if (education == null || string.IsNullOrWhiteSpace(education.Track))
        {
            return new HardGateResult(false, "Education track unclear; needs review.");
        }

        var matchingStrategy = _strategies.FirstOrDefault(s => s.CanEvaluate(education.Track));
        if (matchingStrategy != null)
        {
            return matchingStrategy.Evaluate(education);
        }

        return new HardGateResult(false, "Education track unclear; needs review.");
    }
}
