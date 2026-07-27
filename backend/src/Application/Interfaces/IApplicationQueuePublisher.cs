using System.Threading;
using System.Threading.Tasks;
using Domain.Messaging;

namespace Application.Interfaces;

/// <summary>
/// Publishes application processing messages onto the ingest queue.
/// The concrete transport (Azure Service Bus) lives in Infrastructure so the
/// Application layer stays free of messaging dependencies.
/// </summary>
public interface IApplicationQueuePublisher
{
    /// <summary>
    /// Enqueues a <see cref="CvProcessingMessage"/> for asynchronous processing
    /// by the background worker. Should be called only after the associated
    /// application record has been committed to the database.
    /// </summary>
    Task PublishAsync(CvProcessingMessage message, CancellationToken cancellationToken = default);
}
