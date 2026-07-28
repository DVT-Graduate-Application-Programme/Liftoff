using Application.Commands.IngestEvaluation;

namespace Application.Evaluation;

public interface IHardGateEvaluationStrategy
{
    bool CanEvaluate(string track);
    HardGateResult Evaluate(EducationScoreDto education);
}
