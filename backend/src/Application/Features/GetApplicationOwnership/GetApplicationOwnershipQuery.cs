using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.GetApplicationOwnership;

public record GetApplicationOwnershipQuery(Guid ApplicationId) : IRequest<ApplicationOwnership?>;

public class GetApplicationOwnershipHandler : IRequestHandler<GetApplicationOwnershipQuery, ApplicationOwnership?>
{
    private readonly IApplicationQueryService _queryService;

    public GetApplicationOwnershipHandler(IApplicationQueryService queryService)
    {
        _queryService = queryService;
    }

    public Task<ApplicationOwnership?> Handle(GetApplicationOwnershipQuery request, CancellationToken cancellationToken)
    {
        return _queryService.GetOwnershipAsync(request.ApplicationId, cancellationToken);
    }
}
