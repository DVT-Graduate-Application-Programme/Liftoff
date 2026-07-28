using Application.Interfaces;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Commands.ReevaluateApplication;

public record ReevaluateApplicationCommand(Guid ApplicationId) : IRequest<bool>;

public class ReevaluateApplicationHandler : IRequestHandler<ReevaluateApplicationCommand, bool>
{
    private readonly IApplicationEvaluationService _evaluationService;
    private readonly IApplicationRecordRepository _repository;

    public ReevaluateApplicationHandler(
        IApplicationEvaluationService evaluationService,
        IApplicationRecordRepository repository)
    {
        _evaluationService = evaluationService;
        _repository = repository;
    }

    public async Task<bool> Handle(ReevaluateApplicationCommand request, CancellationToken cancellationToken)
    {
        var result = await _evaluationService.ResetEvaluationAsync(request.ApplicationId, cancellationToken);
        if (!result) return false;

        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
