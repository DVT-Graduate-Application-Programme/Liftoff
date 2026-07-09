using MediatR;
using Application.Commands.IngestEvaluation;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Api.Internal;

public static class EvaluationEndpoints
{
    public static void MapEvaluationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/internal/evaluation");

        group.MapPost("/", async (IngestEvaluationCommand command, IMediator mediator) =>
        {
            if (string.IsNullOrWhiteSpace(command.ApplicationId))
                return Results.BadRequest("ApplicationId is required.");


            var result = await mediator.Send(command);
            return Results.Accepted("/internal/evaluation", result);
        })
        .WithName("IngestEvaluation");
    }
}