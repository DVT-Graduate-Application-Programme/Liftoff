public static class IngestEndpoints
{
    public static IEndpointRouteBuilder MapIngestEndpoints(this IEndpointRouteBuilder app)
    {
           app.MapGroup("/api/applications")
            .MapPost("/ingest", IngestAsync)
            .WithName("IngestApplication");

        return app;
    }

    private static async Task<IResult> IngestAsync([Microsoft.AspNetCore.Mvc.FromForm] IngestApplicationRequest request, IngestApplicationHandler handler, CancellationToken ct)
    {
        var result = await handler.HandleAsync(request, ct);
        return Results.Accepted(value: result);   // 202 — Ingest API never waits on AI processing
    }

}