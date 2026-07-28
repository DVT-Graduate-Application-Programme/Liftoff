using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Queries.GetApplicationLogs;

public record GetApplicationLogsQuery(Guid? ApplicationId = null) : IRequest<List<RecruiterActionLogDto>>;

public class GetApplicationLogsHandler : IRequestHandler<GetApplicationLogsQuery, List<RecruiterActionLogDto>>
{
    private readonly IApplicationQueryService _queryService;

    public GetApplicationLogsHandler(IApplicationQueryService queryService)
    {
        _queryService = queryService;
    }

    public Task<List<RecruiterActionLogDto>> Handle(GetApplicationLogsQuery request, CancellationToken cancellationToken)
    {
        if (request.ApplicationId.HasValue)
        {
            return _queryService.GetRecruiterLogsAsync(request.ApplicationId.Value, cancellationToken);
        }
        return _queryService.GetAllRecruiterLogsAsync(cancellationToken);
    }
}
