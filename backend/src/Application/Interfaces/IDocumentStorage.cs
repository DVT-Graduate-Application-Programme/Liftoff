using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public enum DocumentKind
{
    Cv,
    Transcript
}

/// <summary>
/// Durable storage for candidate documents. Uploads must survive a container restart, so
/// implementations write to an external store (Azure Blob Storage in every deployed
/// environment, Azurite locally) — never to the container's own filesystem.
/// </summary>
public interface IDocumentStorage
{
    /// <summary>
    /// Persists a document and returns the reference to store on the application record.
    /// The reference is opaque to callers; pass it back to <see cref="GetAsync"/> to read.
    /// </summary>
    Task<string> SaveAsync(
        DocumentKind kind,
        Guid applicationId,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Opens a stored document, or returns null when the reference points at nothing.
    /// </summary>
    Task<Stream?> GetAsync(string reference, CancellationToken cancellationToken = default);

    /// <summary>
    /// True when the reference was produced by this storage. Attachment references predating
    /// blob storage hold Graph attachment ids or share URLs, which other retrievers resolve.
    /// </summary>
    bool OwnsReference(string reference);
}
