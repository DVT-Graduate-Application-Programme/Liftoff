using Backend.Application.Interfaces;
using Backend.Application.Queries.GetCandidate;
using MediatR;

namespace Backend.Application.Features.Resumes.Queries.GetCandidate;

public class GetCandidateHandler
    : IRequestHandler<GetCandidateQuery, CandidateDto?>
{
    private readonly IResumeStorage _storage;

    public GetCandidateHandler(IResumeStorage storage)
    {
        _storage = storage;
    }

    public Task<CandidateDto?> Handle(
        GetCandidateQuery request,
        CancellationToken cancellationToken)
    {
        return _storage.GetCandidateAsync(
            request.Id,
            cancellationToken);
    }
}