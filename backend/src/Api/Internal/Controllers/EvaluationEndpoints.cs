using MediatR;
using Application.Features.IngestEvaluation;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Api.Internal;

public static class EvaluationEndpoints
{
    public static void MapEvaluationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/internal/evaluation");

        group.MapPost("/", async (
            HttpContext httpContext,
            IngestEvaluationCommand command,
            IMediator mediator,
            IConfiguration configuration) =>
        {
            var configuredKey = Environment.GetEnvironmentVariable("INTERNAL_API_KEY")
                ?? configuration["InternalApiKey"]
                ?? "local-internal-key";

            var providedKey = httpContext.Request.Headers["X-Internal-Api-Key"].ToString();
            if (string.IsNullOrWhiteSpace(providedKey) || !IsKeyValid(providedKey, configuredKey))
            {
                return Results.Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(command.ApplicationId))
                return Results.BadRequest("ApplicationId is required.");

            var result = await mediator.Send(command);
            return Results.Accepted("/internal/evaluation", result);
        })
        .WithName("IngestEvaluation");
    }

    private static bool IsKeyValid(string provided, string expected)
    {
        var providedBytes = System.Text.Encoding.UTF8.GetBytes(provided);
        var expectedBytes = System.Text.Encoding.UTF8.GetBytes(expected);
        return System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
    }
}