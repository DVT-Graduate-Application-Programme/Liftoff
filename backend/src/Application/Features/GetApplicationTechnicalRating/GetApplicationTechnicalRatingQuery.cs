using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.GetApplicationTechnicalRating;

public record GetApplicationTechnicalRatingQuery(Guid ApplicationId) : IRequest<ApplicationTechnicalRatingDto?>;

public class GetApplicationTechnicalRatingHandler : IRequestHandler<GetApplicationTechnicalRatingQuery, ApplicationTechnicalRatingDto?>
{
    private readonly IApplicationQueryService _queryService;

    public GetApplicationTechnicalRatingHandler(IApplicationQueryService queryService)
    {
        _queryService = queryService;
    }

    public Task<ApplicationTechnicalRatingDto?> Handle(GetApplicationTechnicalRatingQuery request, CancellationToken cancellationToken)
    {
        return _queryService.GetTechnicalRatingAsync(request.ApplicationId, cancellationToken);
    }
}
