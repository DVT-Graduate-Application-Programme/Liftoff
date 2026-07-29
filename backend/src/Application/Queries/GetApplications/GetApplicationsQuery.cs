using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Queries.GetApplications;

public class GetApplicationsQuery : IRequest<List<ApplicationRecordDto>>;

public class GetApplicationsHandler : IRequestHandler<GetApplicationsQuery, List<ApplicationRecordDto>>
{
    private readonly IApplicationRecordRepository _repository;

    public GetApplicationsHandler(IApplicationRecordRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ApplicationRecordDto>> Handle(GetApplicationsQuery request, CancellationToken cancellationToken)
    {
        var applications = await _repository.GetAllAsync(cancellationToken);
        return applications.Select(a => a.ToDto()).ToList();
    }
}
