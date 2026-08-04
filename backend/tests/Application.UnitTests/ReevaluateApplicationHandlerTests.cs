using Application.Features.ReevaluateApplication;
using Application.Interfaces;
using Domain.Messaging;
using FluentAssertions;
using NSubstitute;

namespace Application.UnitTests;

public class ReevaluateApplicationHandlerTests
{
    private readonly IApplicationEvaluationService _evaluationService = Substitute.For<IApplicationEvaluationService>();
    private readonly IApplicationRecordRepository _repository = Substitute.For<IApplicationRecordRepository>();
    private readonly IApplicationQueuePublisher _queuePublisher = Substitute.For<IApplicationQueuePublisher>();

    [Fact]
    public async Task Handle_QueuesTheApplicationForRescoringWhenTheResetSucceeds()
    {
        var applicationId = Guid.NewGuid();
        _evaluationService.ResetEvaluationAsync(applicationId, Arg.Any<CancellationToken>()).Returns(true);

        var result = await CreateHandler().Handle(new ReevaluateApplicationCommand(applicationId), CancellationToken.None);

        result.Should().BeTrue();
        await _queuePublisher.Received(1).PublishAsync(
            Arg.Is<CvProcessingMessage>(message => message.ApplicationId == applicationId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DoesNotQueueAnythingWhenTheApplicationDoesNotExist()
    {
        var applicationId = Guid.NewGuid();
        _evaluationService.ResetEvaluationAsync(applicationId, Arg.Any<CancellationToken>()).Returns(false);

        var result = await CreateHandler().Handle(new ReevaluateApplicationCommand(applicationId), CancellationToken.None);

        result.Should().BeFalse();
        await _repository.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
        await _queuePublisher.DidNotReceiveWithAnyArgs().PublishAsync(default!, default);
    }

    /// <summary>
    /// The worker may pick the message up the instant it lands, and the hiring agent reads the
    /// application back from the API. Publishing before the reset is committed would let it read
    /// — and re-report against — the evaluation being cleared.
    /// </summary>
    [Fact]
    public async Task Handle_CommitsTheResetBeforePublishingToTheQueue()
    {
        var applicationId = Guid.NewGuid();
        _evaluationService.ResetEvaluationAsync(applicationId, Arg.Any<CancellationToken>()).Returns(true);

        var savedBeforePublish = false;
        _queuePublisher
            .PublishAsync(Arg.Any<CvProcessingMessage>(), Arg.Any<CancellationToken>())
            .Returns(_ => Task.CompletedTask)
            .AndDoes(_ => savedBeforePublish = _repository.ReceivedCalls().Any());

        await CreateHandler().Handle(new ReevaluateApplicationCommand(applicationId), CancellationToken.None);

        savedBeforePublish.Should().BeTrue();
    }

    private ReevaluateApplicationHandler CreateHandler() =>
        new(_evaluationService, _repository, _queuePublisher);
}
