using Backend.Application.Queries.GetCandidate;
using Backend.Application.Queries.GetResumeDocument;
using Backend.Application.Queries.GetResumes;

namespace Backend.Application.Interfaces;

public interface IResumeStorage
{
    Task<List<ResumeDto>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<ResumeDocumentDto?> GetDocumentAsync(
    Guid id,
    CancellationToken cancellationToken);

    Task<ResumeDocumentDto?> GetTranscriptAsync(
    Guid id,
    CancellationToken cancellationToken);

    Task<CandidateDto?> GetCandidateAsync(
    Guid id,
    CancellationToken cancellationToken);
}
