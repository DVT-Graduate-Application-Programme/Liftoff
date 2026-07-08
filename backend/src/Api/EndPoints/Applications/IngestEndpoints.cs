using System.Threading;
using System.Threading.Tasks;
using Application.Features.Ingestion;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Api.EndPoints.Applications;

public static class IngestEndpoints
{
    public static IEndpointRouteBuilder MapIngestEndpoints(this IEndpointRouteBuilder app)
    {
           app.MapGroup("/api/applications")
            .MapPost("/ingest", IngestAsync)
            .WithName("IngestApplication");

        return app;
    }

    private static async Task<IResult> IngestAsync(IngestApplicationRequest request, MediatR.IMediator mediator, CancellationToken ct)
    {
        var result = await mediator.Send(request, ct);
        return Results.Accepted(value: result);   // 202 — Ingest API never waits on AI processing
    }

}