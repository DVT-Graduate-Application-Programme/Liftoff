using Application.Features.IngestEvaluation;

namespace Application.Evaluation;

public interface IHardGateEvaluator
{
    HardGateResult Evaluate(EducationScoreDto education);
}
