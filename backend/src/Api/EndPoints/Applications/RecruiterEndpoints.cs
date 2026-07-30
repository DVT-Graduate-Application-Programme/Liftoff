using Application.Features.AddRecruiter;
using Application.Features.GetRecruiters;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Threading;

namespace Api.EndPoints.Applications;

public static class RecruiterEndpoints
{
    public static void MapRecruiterEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/applications").WithTags("Recruiters");

        // GET /api/applications/recruiter
        group.MapGet("/recruiter", async (IMediator mediator, CancellationToken ct) =>
        {
            var recruiters = await mediator.Send(new GetRecruitersQuery(), ct);
            return recruiters is not null ? Results.Ok(recruiters) : Results.NotFound();
        })
        .WithName("GetRecruiters");

        // POST /api/applications/recruiter
        group.MapPost("/recruiter", async (RecruiterPostDto recruiter, IMediator mediator, CancellationToken ct) =>
        {
            var createdRecruiter = await mediator.Send(new AddRecruiterCommand(recruiter), ct);
            return Results.Created($"/api/applications/recruiter/{createdRecruiter.Email}", createdRecruiter);
        })
        .WithName("AddRecruiter");
    }
}
