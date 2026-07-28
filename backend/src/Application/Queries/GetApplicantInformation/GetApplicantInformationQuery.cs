using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Queries.GetApplicantInformation;

public record GetApplicantInformationQuery(Guid ApplicationId) : IRequest<Applicant?>;

public class GetApplicantInformationHandler : IRequestHandler<GetApplicantInformationQuery, Applicant?>
{
    private readonly IApplicationQueryService _queryService;

    public GetApplicantInformationHandler(IApplicationQueryService queryService)
    {
        _queryService = queryService;
    }

    public Task<Applicant?> Handle(GetApplicantInformationQuery request, CancellationToken cancellationToken)
    {
        return _queryService.GetApplicantByApplicationIdAsync(request.ApplicationId, cancellationToken);
    }
}
