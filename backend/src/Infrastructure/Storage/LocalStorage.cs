using Backend.Application.Interfaces;
using Backend.Application.Queries.GetCandidate;
using Backend.Application.Queries.GetResumeDocument;
using Backend.Application.Queries.GetResumes;
using Microsoft.AspNetCore.Hosting;

namespace Backend.Infrastructure.Storage;

public class LocalResumeStorage : IResumeStorage
{
    private readonly IWebHostEnvironment _environment;

    public LocalResumeStorage(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public Task<List<ResumeDto>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        var folder = Path.Combine(
            _environment.ContentRootPath,
            "Internal",
            "SampleData",
            "data"
        );

        if (!Directory.Exists(folder))
            return Task.FromResult(new List<ResumeDto>());

        var files = Directory.GetFiles(folder, "*.pdf")
            .Where(f => !f.EndsWith("_transcript.pdf"))
            .ToArray();

        var resumes = files
            .Select((file, index) => new ResumeDto
            {
                Id = index + 1,
                CandidateName = Path.GetFileNameWithoutExtension(file),
                DocumentUrl = $"/api/resumes/{index + 1}/document",
                TranscriptUrl = File.Exists(file.Replace(".pdf", "_transcript.pdf"))
                    ? $"/api/resumes/{index + 1}/transcript"
                    : null
            })
            .ToList();

        return Task.FromResult(resumes);
    }

    public async Task<ResumeDocumentDto?> GetDocumentAsync(
    int id,
    CancellationToken cancellationToken)
    {
        var folder = Path.Combine(
            _environment.ContentRootPath,
            "Internal",
            "SampleData",
            "data");

        var files = Directory.GetFiles(folder, "*.pdf")
            .Where(f => !f.EndsWith("_transcript.pdf"))
            .ToArray();

        if (id < 1 || id > files.Length)
            return null;

        var file = files[id - 1];

        var stream = File.OpenRead(file);

        return await Task.FromResult(new ResumeDocumentDto
        {
            Content = stream,
            FileName = Path.GetFileName(file),
            ContentType = "application/pdf"
        });
    }

    public async Task<ResumeDocumentDto?> GetTranscriptAsync(
    int id,
    CancellationToken cancellationToken)
    {
        var folder = Path.Combine(
            _environment.ContentRootPath,
            "Internal",
            "SampleData",
            "data");

        var files = Directory.GetFiles(folder, "*.pdf")
            .Where(f => !f.EndsWith("_transcript.pdf"))
            .ToArray();

        if (id < 1 || id > files.Length)
            return null;

        var cvFile = files[id - 1];
        var transcriptFile = cvFile.Replace(".pdf", "_transcript.pdf");

        if (!File.Exists(transcriptFile))
            return null;

        var stream = File.OpenRead(transcriptFile);

        return await Task.FromResult(new ResumeDocumentDto
        {
            Content = stream,
            FileName = Path.GetFileName(transcriptFile),
            ContentType = "application/pdf"
        });
    }

    public Task<CandidateDto?> GetCandidateAsync(
    int id,
    CancellationToken cancellationToken)
    {
        var folder = Path.Combine(
            _environment.ContentRootPath,
            "Internal",
            "SampleData",
            "data");

        var files = Directory.GetFiles(folder, "*.pdf")
            .Where(f => !f.EndsWith("_transcript.pdf"))
            .ToArray();

        if (id < 1 || id > files.Length)
            return Task.FromResult<CandidateDto?>(null);

        var file = files[id - 1];

        var candidate = new CandidateDto
        {
            Id = id,
            CandidateName = Path.GetFileNameWithoutExtension(file),
            FileName = Path.GetFileName(file),
            DocumentUrl = $"/api/resumes/{id}/document",
            TranscriptUrl = File.Exists(file.Replace(".pdf", "_transcript.pdf"))
                ? $"/api/resumes/{id}/transcript"
                : null
        };

        return Task.FromResult<CandidateDto?>(candidate);
    }
}