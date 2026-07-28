using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Queries.GetApplicationDetails;

public record GetApplicationDetailsQuery(Guid Id) : IRequest<ApplicationDetails?>;

public class GetApplicationDetailsHandler : IRequestHandler<GetApplicationDetailsQuery, ApplicationDetails?>
{
    private readonly IApplicationQueryService _queryService;

    public GetApplicationDetailsHandler(IApplicationQueryService queryService)
    {
        _queryService = queryService;
    }

    public Task<ApplicationDetails?> Handle(GetApplicationDetailsQuery request, CancellationToken cancellationToken)
    {
        return _queryService.GetApplicationDetailsAsync(request.Id, cancellationToken);
    }
}
