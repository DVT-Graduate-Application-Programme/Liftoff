using Backend.Application.Interfaces;
using MediatR;

namespace Backend.Application.Queries.GetResumes;

public class GetResumesHandler
    : IRequestHandler<GetResumesQuery, List<ResumeDto>>
{
    private readonly IResumeStorage _resumeStorage;

    public GetResumesHandler(IResumeStorage resumeStorage)
    {
        _resumeStorage = resumeStorage;
    }

    public async Task<List<ResumeDto>> Handle(
        GetResumesQuery request,
        CancellationToken cancellationToken)
    {
        return await _resumeStorage.GetAllAsync(cancellationToken);
    }
}