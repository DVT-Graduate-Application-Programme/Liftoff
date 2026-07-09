using MediatR;

namespace Application.Commands.IngestEvaluation;

public class IngestEvaluationResult
{
    public bool Accepted { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class IngestEvaluationHandler
    : IRequestHandler<IngestEvaluationCommand, IngestEvaluationResult>
{
    // TODO: inject DbContext here when the DB is ready
    // private readonly GradRecruitmentDbContext _db;
    // public IngestEvaluationHandler(GradRecruitmentDbContext db) => _db = db;

    public Task<IngestEvaluationResult> Handle(
        IngestEvaluationCommand request,
        CancellationToken cancellationToken)
    {
        // TODO: replace this stub with the real DB write, e.g.:
        //
        // var record = await _db.ApplicationRecords
        //     .FirstOrDefaultAsync(a => a.Id == Guid.Parse(request.ApplicationId), cancellationToken)
        //     ?? throw new NotFoundException(request.ApplicationId);
        //
        // var evaluation = new HiringAgentEvaluation
        // {
        //     Id                      = Guid.NewGuid(),
        //     ApplicationRecordId     = record.Id,
        //     CategoryScoresJson      = JsonSerializer.Serialize(request.Scores),
        //     BonusPointsJson         = JsonSerializer.Serialize(request.BonusPoints),
        //     KeyStrengthsJson        = JsonSerializer.Serialize(request.KeyStrengths),
        //     AreasForImprovementJson = JsonSerializer.Serialize(request.AreasForImprovement),
        //     ProcessedAt             = DateTime.UtcNow
        // };
        //
        // record.Status    = request.PromptInjectionDetected ? "MANUAL_REVIEW" : "VALID";
        // record.UpdatedAt = DateTime.UtcNow;
        //
        // _db.HiringAgentEvaluations.Add(evaluation);
        // await _db.SaveChangesAsync(cancellationToken);
        
        return Task.FromResult(new IngestEvaluationResult
        {
            Accepted = true,
            Message = $"Evaluation received for application '{request.ApplicationId}' — persistence pending DB setup."
        });
    }
}