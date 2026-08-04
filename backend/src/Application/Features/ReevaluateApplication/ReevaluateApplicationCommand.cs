using Application.Interfaces;
using Domain.Messaging;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.ReevaluateApplication;

public record ReevaluateApplicationCommand(Guid ApplicationId) : IRequest<bool>;

/// <summary>
/// Clears an application's existing evaluation and queues it to be scored again.
///
/// The re-scoring goes onto the ingest queue rather than straight to the hiring agent so it
/// gets the same durability as a new application: if the agent is down, the worker re-enqueues
/// the message on an exponential backoff until it comes back, and dead-letters it only after
/// the retry budget is spent. A direct call would have no such second chance, and this command
/// has already discarded the previous scores by the time the hand-off happens.
/// </summary>
public class ReevaluateApplicationHandler : IRequestHandler<ReevaluateApplicationCommand, bool>
{
    private readonly IApplicationEvaluationService _evaluationService;
    private readonly IApplicationRecordRepository _repository;
    private readonly IApplicationQueuePublisher _queuePublisher;

    public ReevaluateApplicationHandler(
        IApplicationEvaluationService evaluationService,
        IApplicationRecordRepository repository,
        IApplicationQueuePublisher queuePublisher)
    {
        _evaluationService = evaluationService;
        _repository = repository;
        _queuePublisher = queuePublisher;
    }

    public async Task<bool> Handle(ReevaluateApplicationCommand request, CancellationToken cancellationToken)
    {
        var result = await _evaluationService.ResetEvaluationAsync(request.ApplicationId, cancellationToken);
        if (!result) return false;

        await _repository.SaveChangesAsync(cancellationToken);

        // Published only after the reset is committed. The worker can pick the message up
        // immediately, and the agent reads the application back from the API — it must not
        // observe the evaluation this command is in the middle of clearing.
        await _queuePublisher.PublishAsync(new CvProcessingMessage(request.ApplicationId), cancellationToken);

        return true;
    }
}
