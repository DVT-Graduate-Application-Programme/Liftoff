using MediatR;

namespace Application.Commands.IngestTranscript;

public class IngestTranscriptResult
{
    public bool Accepted { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class IngestTranscriptHandler
    : IRequestHandler<IngestTranscriptCommand, IngestTranscriptResult>
{
    // TODO: inject IApplicationRepository (or DbContext) here when the DB is ready
    // private readonly IApplicationRepository _repository;
    // public IngestTranscriptHandler(IApplicationRepository repository) => _repository = repository;

    public Task<IngestTranscriptResult> Handle(
        IngestTranscriptCommand request,
        CancellationToken cancellationToken)
    {
        // TODO: replace this stub with the real DB write, e.g.:
        // await _repository.SaveTranscriptAsync(request, cancellationToken);

        return Task.FromResult(new IngestTranscriptResult
        {
            Accepted = true,
            Message = $"Transcript received for '{request.DegreeName}' — persistence pending DB setup."
        });
    }
}