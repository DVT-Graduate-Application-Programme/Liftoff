using MediatR;

namespace Backend.Application.Queries.GetCandidate;

public record GetCandidateQuery(Guid Id)
    : IRequest<CandidateDto?>;