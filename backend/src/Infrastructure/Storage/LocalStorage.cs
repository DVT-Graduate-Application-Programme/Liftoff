using Backend.Application.Interfaces;
using Backend.Application.Queries.GetCandidate;
using Backend.Application.Queries.GetResumeDocument;
using Backend.Application.Queries.GetResumes;
using Microsoft.AspNetCore.Hosting;
using System.Security.Cryptography;
using System.Text;

namespace Backend.Infrastructure.Storage;

public class LocalResumeStorage : IResumeStorage
{
    private readonly IWebHostEnvironment _environment;
    private readonly Lazy<IReadOnlyDictionary<Guid, LocalResumeFile>> _resumeFiles;

    public LocalResumeStorage(IWebHostEnvironment environment)
    {
        _environment = environment;
        _resumeFiles = new Lazy<IReadOnlyDictionary<Guid, LocalResumeFile>>(
            BuildResumeFileIndex,
            LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public Task<List<ResumeDto>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        var resumes = _resumeFiles.Value.Values
            .Select(file => new ResumeDto
            {
                Id = file.Id,
                CandidateName = Path.GetFileNameWithoutExtension(file.DocumentPath),
                DocumentUrl = $"/api/resumes/{file.Id}/document",
                TranscriptUrl = file.TranscriptPath is not null
                    ? $"/api/resumes/{file.Id}/transcript"
                    : null
            })
            .ToList();

        return Task.FromResult(resumes);
    }

    public async Task<ResumeDocumentDto?> GetDocumentAsync(
    Guid id,
    CancellationToken cancellationToken)
    {
        if (!_resumeFiles.Value.TryGetValue(id, out var file))
            return null;

        var stream = File.OpenRead(file.DocumentPath);

        return await Task.FromResult(new ResumeDocumentDto
        {
            Content = stream,
            FileName = Path.GetFileName(file.DocumentPath),
            ContentType = "application/pdf"
        });
    }

    public async Task<ResumeDocumentDto?> GetTranscriptAsync(
    Guid id,
    CancellationToken cancellationToken)
    {
        if (!_resumeFiles.Value.TryGetValue(id, out var file) ||
            file.TranscriptPath is null)
        {
            return null;
        }

        var stream = File.OpenRead(file.TranscriptPath);

        return await Task.FromResult(new ResumeDocumentDto
        {
            Content = stream,
            FileName = Path.GetFileName(file.TranscriptPath),
            ContentType = "application/pdf"
        });
    }

    public Task<CandidateDto?> GetCandidateAsync(
    Guid id,
    CancellationToken cancellationToken)
    {
        if (!_resumeFiles.Value.TryGetValue(id, out var file))
            return Task.FromResult<CandidateDto?>(null);

        var candidate = new CandidateDto
        {
            Id = id,
            CandidateName = Path.GetFileNameWithoutExtension(file.DocumentPath),
            FileName = Path.GetFileName(file.DocumentPath),
            DocumentUrl = $"/api/resumes/{id}/document",
            TranscriptUrl = file.TranscriptPath is not null
                ? $"/api/resumes/{id}/transcript"
                : null
        };

        return Task.FromResult<CandidateDto?>(candidate);
    }

    private IReadOnlyDictionary<Guid, LocalResumeFile> BuildResumeFileIndex()
    {
        var folder = Path.Combine(
            _environment.ContentRootPath,
            "Internal",
            "SampleData",
            "data");

        if (!Directory.Exists(folder))
            return new Dictionary<Guid, LocalResumeFile>();

        return Directory.EnumerateFiles(folder, "*.pdf")
            .Where(IsResumeDocument)
            .OrderBy(Path.GetFileName, StringComparer.OrdinalIgnoreCase)
            .Select(file => CreateResumeFile(file, folder))
            .ToDictionary(file => file.Id);
    }

    private static LocalResumeFile CreateResumeFile(string documentPath, string folder)
    {
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(documentPath);
        var transcriptPath = Path.Combine(folder, $"{fileNameWithoutExtension}_transcript.pdf");

        return new LocalResumeFile(
            CreateStableId(fileNameWithoutExtension),
            documentPath,
            File.Exists(transcriptPath) ? transcriptPath : null);
    }

    private static bool IsResumeDocument(string path)
    {
        var fileName = Path.GetFileNameWithoutExtension(path);
        return !fileName.EndsWith("_transcript", StringComparison.OrdinalIgnoreCase);
    }

    private static Guid CreateStableId(string fileNameWithoutExtension)
    {
        if (Guid.TryParse(fileNameWithoutExtension, out var id))
            return id;

        var normalizedFileName = fileNameWithoutExtension.ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedFileName));
        return new Guid(bytes[..16]);
    }

    private sealed record LocalResumeFile(
        Guid Id,
        string DocumentPath,
        string? TranscriptPath);
}
