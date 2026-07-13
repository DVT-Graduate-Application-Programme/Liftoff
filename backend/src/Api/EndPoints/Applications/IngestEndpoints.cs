using System.Threading;
using System.Threading.Tasks;
using Application.Features.Ingestion;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.EndPoints.Applications;

public static class IngestEndpoints
{
    public static IEndpointRouteBuilder MapIngestEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGroup("/api/applications")
         .MapPost("/ingest", IngestAsync)
         .WithName("IngestApplication")
         .DisableAntiforgery();

        return app;
    }

    private static async Task<IResult> IngestAsync(
        [FromForm] global::IngestApplicationRequest request,
        HttpRequest httpRequest,
        MediatR.IMediator mediator,
        CancellationToken ct)
    {
        var command = new IngestManualApplicationCommand
        {
            CandidateName = request.CandidateName,
            CandidateEmail = request.CandidateEmail,
            IdempotencyKey = httpRequest.Headers["Idempotency-Key"].ToString(),
            HasCvFile = request.CvFile is not null,
            HasTranscriptFile = request.TranscriptFile is not null
        };

        var result = await mediator.Send(command, ct);
        return Results.Accepted(value: result);
    }
}
