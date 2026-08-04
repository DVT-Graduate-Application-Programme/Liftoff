using Application.DTOs;
using Application.Interfaces;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.GetRecruiters;

public class GetRecruitersQuery : IRequest<List<RecruiterDto>?>;

public class GetRecruitersHandler : IRequestHandler<GetRecruitersQuery, List<RecruiterDto>?>
{
    private readonly IRecruiterRepository _recruiterRepository;

    public GetRecruitersHandler(IRecruiterRepository recruiterRepository)
    {
        _recruiterRepository = recruiterRepository;
    }

    public async Task<List<RecruiterDto>?> Handle(GetRecruitersQuery request, CancellationToken cancellationToken)
    {
        var recruiters = await _recruiterRepository.GetRecruitersAsync(cancellationToken);
        return recruiters?.Select(r => r.ToDto()).ToList();
    }
}
