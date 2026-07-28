using Backend.Application.Interfaces;
using Backend.Application.Queries.GetResumeDocument;
using MediatR;

namespace Backend.Application.Features.Resumes.Queries.GetResumeDocument;

public class GetResumeDocumentHandler
    : IRequestHandler<GetResumeDocumentQuery, ResumeDocumentDto?>
{
    private readonly IResumeStorage _storage;

    public GetResumeDocumentHandler(IResumeStorage storage)
    {
        _storage = storage;
    }

    public Task<ResumeDocumentDto?> Handle(
        GetResumeDocumentQuery request,
        CancellationToken cancellationToken)
    {
        return _storage.GetDocumentAsync(
            request.Id,
            cancellationToken);
    }
}