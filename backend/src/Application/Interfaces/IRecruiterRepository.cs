using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces;

public interface IRecruiterRepository
{
    Task<Recruiter?> GetRecruiters(CancellationToken cancellationToken = default);
}
