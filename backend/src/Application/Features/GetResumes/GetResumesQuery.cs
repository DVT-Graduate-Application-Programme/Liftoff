using MediatR;

namespace Backend.Application.Queries.GetResumes;
public record GetResumesQuery() : IRequest<List<ResumeDto>>;