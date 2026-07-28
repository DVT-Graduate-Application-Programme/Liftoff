using Application.Interfaces;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Queries.GetHiringAgentEvaluation;

public record GetHiringAgentEvaluationQuery(Guid ApplicationId) : IRequest<HiringAgentEvaluation?>;

public class GetHiringAgentEvaluationHandler : IRequestHandler<GetHiringAgentEvaluationQuery, HiringAgentEvaluation?>
{
    private readonly IApplicationQueryService _queryService;

    public GetHiringAgentEvaluationHandler(IApplicationQueryService queryService)
    {
        _queryService = queryService;
    }

    public Task<HiringAgentEvaluation?> Handle(GetHiringAgentEvaluationQuery request, CancellationToken cancellationToken)
    {
        return _queryService.GetHardGateEvaluationByApplicationIdAsync(request.ApplicationId, cancellationToken);
    }
}
