using Application.Features.SendApplication;
using System.IO;
using System.Linq;
using System.Threading;
using Application.Features.SendApplication;
using FluentAssertions;

namespace Application.UnitTests;

public class SendApplicationCommandValidatorTests
{
    private readonly SendApplicationCommandValidator _validator;

    public SendApplicationCommandValidatorTests()
    {
        _validator = new SendApplicationCommandValidator();
    }

    [Fact]
    public async Task Validate_PassesForCompleteApplication()
    {
        var command = new SendApplicationCommand
        {
            CandidateName = "Candidate One",
            CandidateEmail = "candidate@example.com",
            CvStream = new MemoryStream(new byte[] { 1, 2, 3 })
        };

        var result = await _validator.ValidateAsync(command, CancellationToken.None);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Validate_FailsWhenRequiredFieldsAreMissingOrInvalid()
    {
        var command = new SendApplicationCommand
        {
            CandidateName = "",
            CandidateEmail = "not-an-email",
            CvStream = null!
        };

        var result = await _validator.ValidateAsync(command, CancellationToken.None);

        result.IsValid.Should().BeFalse();
        result.Errors.Select(error => error.PropertyName)
            .Should().BeEquivalentTo(new[] {
                nameof(SendApplicationCommand.CandidateName),
                nameof(SendApplicationCommand.CandidateEmail),
                nameof(SendApplicationCommand.CvStream)
            });
    }
}