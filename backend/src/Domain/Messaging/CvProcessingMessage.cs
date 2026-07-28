namespace Domain.Messaging;

/// <summary>
/// Message published to the application-ingest Service Bus queue when a new
/// application record has been persisted and is ready for CV evaluation.
/// The worker consumes this and hands the application off to the hiring agent.
/// </summary>
/// <param name="ApplicationId">Identifier of the persisted <c>ApplicationRecord</c>.</param>
public sealed record CvProcessingMessage(Guid ApplicationId);
