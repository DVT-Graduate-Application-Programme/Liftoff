using Application.Features.SendApplicaton;
using FluentAssertions;

namespace Application.UnitTests;

public class SendApplicationCommandValidatorTests
{
    private readonly SendApplicationCommandValidator _validator = new();

    [Fact]
    public void Validate_PassesForCompleteApplication()
    {
        var command = new SendApplicationCommand
        {
            CandidateName = "Candidate One",
            CandidateEmail = "candidate@example.com",
            CvStream = new MemoryStream([1, 2, 3])
        };

        var result = _validator.Validate(command);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_FailsWhenRequiredFieldsAreMissingOrInvalid()
    {
        var command = new SendApplicationCommand
        {
            CandidateName = "",
            CandidateEmail = "not-an-email",
            CvStream = null!
        };

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Select(error => error.PropertyName)
            .Should().BeEquivalentTo([
                nameof(SendApplicationCommand.CandidateName),
                nameof(SendApplicationCommand.CandidateEmail),
                nameof(SendApplicationCommand.CvStream)
            ]);
    }
}
