using MediatR;

namespace Backend.Application.Queries.GetCandidate;

public record GetCandidateQuery(int Id)
    : IRequest<CandidateDto?>;