using Application.Evaluation;
using Application.Evaluation.Strategies;
using Application.Features.IngestEvaluation;
using FluentAssertions;

namespace Application.UnitTests;

public class HardGateEvaluatorTests
{
    private static HardGateEvaluator CreateEvaluator()
    {
        return new HardGateEvaluator([
            new FormalEducationHardGateStrategy(),
            new SelfTaughtHardGateStrategy(),
            new UnrelatedEducationHardGateStrategy()
        ]);
    }

    [Theory]
    [InlineData("formal_it")]
    [InlineData(" related_field ")]
    public void Evaluate_PassesFormalEducationWhenAcademicRequirementIsMet(string track)
    {
        var evaluator = CreateEvaluator();
        var education = new EducationScoreDto
        {
            Track = track,
            AcademicRequirementMet = "met"
        };

        var result = evaluator.Evaluate(education);

        result.Passed.Should().BeTrue();
        result.Reason.Should().Be("Academic requirement met.");
    }

    [Theory]
    [InlineData("not_met", "Academic requirement not met.")]
    [InlineData("unclear_needs_review", "Academic requirement unclear; needs review.")]
    public void Evaluate_FailsFormalEducationWhenAcademicRequirementIsNotMet(string requirement, string reason)
    {
        var evaluator = CreateEvaluator();
        var education = new EducationScoreDto
        {
            Track = "formal_it",
            AcademicRequirementMet = requirement
        };

        var result = evaluator.Evaluate(education);

        result.Passed.Should().BeFalse();
        result.Reason.Should().Be(reason);
    }

    [Fact]
    public void Evaluate_PassesSelfTaughtWhenExperienceRequirementIsMet()
    {
        var evaluator = CreateEvaluator();
        var education = new EducationScoreDto
        {
            Track = "self_taught",
            ExperienceRequirementMet = "met"
        };

        var result = evaluator.Evaluate(education);

        result.Passed.Should().BeTrue();
        result.Reason.Should().Be("Experience requirement met.");
    }

    [Fact]
    public void Evaluate_FailsSelfTaughtWhenExperienceRequirementIsMissing()
    {
        var evaluator = CreateEvaluator();
        var education = new EducationScoreDto
        {
            Track = "self_taught",
            ExperienceRequirementMet = null!
        };

        var result = evaluator.Evaluate(education);

        result.Passed.Should().BeFalse();
        result.Reason.Should().Be("Experience requirement not met.");
    }

    [Fact]
    public void Evaluate_FailsUnrelatedEducation()
    {
        var evaluator = CreateEvaluator();
        var education = new EducationScoreDto { Track = "unrelated" };

        var result = evaluator.Evaluate(education);

        result.Passed.Should().BeFalse();
        result.Reason.Should().Be("Education track is unrelated.");
    }

    [Theory]
    [InlineData("")]
    [InlineData("unknown_track")]
    public void Evaluate_FailsUnclearEducationTrack(string track)
    {
        var evaluator = CreateEvaluator();
        var education = new EducationScoreDto { Track = track };

        var result = evaluator.Evaluate(education);

        result.Passed.Should().BeFalse();
        result.Reason.Should().Be("Education track unclear; needs review.");
    }
}
