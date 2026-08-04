using Application.Interfaces;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Storage;

public sealed class DocumentStorageOptions
{
    public string CvContainer { get; init; } = "cvs";
    public string TranscriptContainer { get; init; } = "transcripts";
}

/// <summary>
/// Stores CVs and transcripts in Azure Blob Storage (Azurite locally). Container-local disk is
/// ephemeral — anything written there is gone the next time Container Apps recycles the
/// revision — so uploads go straight to blob storage and the application record keeps only a
/// reference to them.
/// </summary>
public sealed class BlobDocumentStorage : IDocumentStorage
{
    /// <summary>
    /// References are stored as blob://{container}/{blobName} rather than a full URL: the
    /// account hostname changes whenever the storage account is recreated, which would strand
    /// every row already in the database.
    /// </summary>
    public const string ReferenceScheme = "blob://";

    private readonly BlobServiceClient _blobServiceClient;
    private readonly DocumentStorageOptions _options;
    private readonly ILogger<BlobDocumentStorage> _logger;

    // Terraform creates both containers, so CreateIfNotExists is a no-op in Azure. It matters
    // for a fresh Azurite volume. Tracked per container so it costs one call per process.
    private readonly ConcurrentDictionary<string, byte> _ensuredContainers = new(StringComparer.Ordinal);

    public BlobDocumentStorage(
        BlobServiceClient blobServiceClient,
        DocumentStorageOptions options,
        ILogger<BlobDocumentStorage> logger)
    {
        _blobServiceClient = blobServiceClient;
        _options = options;
        _logger = logger;
    }

    public async Task<string> SaveAsync(
        DocumentKind kind,
        Guid applicationId,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var containerName = ContainerFor(kind);
        var blobName = string.Empty;
        
        if (kind == DocumentKind.Cv)
        {
            blobName = $"{applicationId}_cv.pdf";
        }
        else if (kind == DocumentKind.Transcript)
        {
            blobName = $"{applicationId}_transcript.pdf";
        }


        var container = await GetContainerAsync(containerName, cancellationToken);
        var blob = container.GetBlobClient(blobName);

        var uploadOptions = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders
            {
                ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/pdf" : contentType
            }
        };

        await blob.UploadAsync(content, uploadOptions, cancellationToken);

        var reference = $"{ReferenceScheme}{containerName}/{blobName}";
        _logger.LogInformation(
            "Stored {Kind} for application {ApplicationId} at {Reference}.",
            kind,
            applicationId,
            reference);

        return reference;
    }

    public async Task<Stream?> GetAsync(string reference, CancellationToken cancellationToken = default)
    {
        if (!TryParseReference(reference, out var containerName, out var blobName))
        {
            return null;
        }

        var blob = _blobServiceClient
            .GetBlobContainerClient(containerName)
            .GetBlobClient(blobName);

        try
        {
            return await blob.OpenReadAsync(cancellationToken: cancellationToken);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogWarning("No blob found at {Reference}.", reference);
            return null;
        }
    }

    public bool OwnsReference(string reference) =>
        TryParseReference(reference, out _, out _);

    private string ContainerFor(DocumentKind kind) => kind switch
    {
        DocumentKind.Cv => _options.CvContainer,
        DocumentKind.Transcript => _options.TranscriptContainer,
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unsupported document kind.")
    };

    private async Task<BlobContainerClient> GetContainerAsync(string containerName, CancellationToken cancellationToken)
    {
        var container = _blobServiceClient.GetBlobContainerClient(containerName);

        if (_ensuredContainers.ContainsKey(containerName))
        {
            return container;
        }

        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
        _ensuredContainers.TryAdd(containerName, 0);

        return container;
    }

    private static bool TryParseReference(string? reference, out string containerName, out string blobName)
    {
        containerName = string.Empty;
        blobName = string.Empty;

        if (string.IsNullOrWhiteSpace(reference) ||
            !reference.StartsWith(ReferenceScheme, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var path = reference[ReferenceScheme.Length..];
        var separatorIndex = path.IndexOf('/');

        if (separatorIndex <= 0 || separatorIndex == path.Length - 1)
        {
            return false;
        }

        containerName = path[..separatorIndex];
        blobName = path[(separatorIndex + 1)..];

        return true;
    }
}
