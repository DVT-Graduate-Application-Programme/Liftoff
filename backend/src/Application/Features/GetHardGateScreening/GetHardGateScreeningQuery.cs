using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.GetHardGateScreening;

public record GetHardGateScreeningQuery(Guid ApplicationId) : IRequest<ApplicationHardGateScreening?>;

public class GetHardGateScreeningHandler : IRequestHandler<GetHardGateScreeningQuery, ApplicationHardGateScreening?>
{
    private readonly IApplicationQueryService _queryService;

    public GetHardGateScreeningHandler(IApplicationQueryService queryService)
    {
        _queryService = queryService;
    }

    public Task<ApplicationHardGateScreening?> Handle(GetHardGateScreeningQuery request, CancellationToken cancellationToken)
    {
        return _queryService.GetHardGateScreeningByApplicationIdAsync(request.ApplicationId, cancellationToken);
    }
}
