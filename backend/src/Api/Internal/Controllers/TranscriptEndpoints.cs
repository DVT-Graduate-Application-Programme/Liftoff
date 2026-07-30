using MediatR;
using Application.Features.IngestTranscript;

namespace Api.Internal;

public static class TranscriptEndpoints
{
    public static void MapTranscriptEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/internal/transcript");

        group.MapPost("/", async (IngestTranscriptCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            Console.WriteLine(result.Message);
            return Results.Accepted("/internal/transcript", result);
        })
        .WithName("IngestTranscript");
    }
}