using Backend.Application.Queries.GetResumeDocument;
using Backend.Application.Queries.GetResumes;

namespace Backend.Application.Interfaces;

public interface IResumeStorage
{
    Task<List<ResumeDto>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<ResumeDocumentDto?> GetDocumentAsync(
    int id,
    CancellationToken cancellationToken);
}