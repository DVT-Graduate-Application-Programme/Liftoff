namespace Application.Interfaces;

/// <summary>
/// Publishes real-time application domain events to connected SSE clients.
/// Implementations are registered as singletons so they survive across scoped
/// repository lifetimes and can broadcast to all active connections.
/// </summary>
public interface IApplicationEventService
{
    /// <summary>Fired when a new application is added via <see cref="IApplicationRecordRepository.AddAsync"/>.</summary>
    void PublishApplicationIngested(Guid applicationId);

    /// <summary>Fired when an AI evaluation is saved via <see cref="IApplicationRecordRepository.AddEvaluationAsync"/>.</summary>
    void PublishEvaluationSaved(Guid applicationId);

    /// <summary>Fired when an evaluation is reset via <see cref="IApplicationRecordRepository.ResetEvaluationAsync"/>.</summary>
    void PublishEvaluationReset(Guid applicationId);

    /// <summary>
    /// Fired when any recruiter ownership action is taken (claim, shortlist, accept,
    /// reject, rate, notes).
    /// </summary>
    /// <param name="changeType">The action type string, e.g. "CLAIM", "SHORTLIST", "ACCEPTED".</param>
    void PublishOwnershipChanged(Guid applicationId, string changeType);
}
