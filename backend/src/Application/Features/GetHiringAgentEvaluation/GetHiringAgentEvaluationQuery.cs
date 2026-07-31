using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.GetHiringAgentEvaluation;

public record GetHiringAgentEvaluationQuery(Guid ApplicationId) : IRequest<HiringAgentEvaluationDto?>;

public class GetHiringAgentEvaluationHandler : IRequestHandler<GetHiringAgentEvaluationQuery, HiringAgentEvaluationDto?>
{
    private readonly IApplicationQueryService _queryService;

    public GetHiringAgentEvaluationHandler(IApplicationQueryService queryService)
    {
        _queryService = queryService;
    }

    public async Task<HiringAgentEvaluationDto?> Handle(GetHiringAgentEvaluationQuery request, CancellationToken cancellationToken)
    {
        var evaluation = await _queryService.GetHardGateEvaluationByApplicationIdAsync(request.ApplicationId, cancellationToken);
        return evaluation?.ToDto();
    }
}
