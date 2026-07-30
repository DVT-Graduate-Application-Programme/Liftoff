using Application.Features.AcceptApplication;
using Application.Features.AddApplicationNotes;
using Application.Features.ClaimApplicationOwnership;
using Application.Features.RateApplication;
using Application.Features.ReevaluateApplication;
using Application.Features.RejectApplication;
using Application.Features.ShortlistApplication;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;

namespace Api.EndPoints.Applications;

public static class ApplicationOwnershipEndpoints
{
    public static void MapApplicationOwnershipEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/applications").WithTags("Applications");

        // POST /api/applications/{id}/ownership/claim
        group.MapPost("/{id:guid}/ownership/claim", async (Guid id, ClaimOwnershipRequest request, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            logger.LogInformation("Recruiter {RecruiterIdentity} is claiming application {ApplicationId}", request.RecruiterIdentity, id);
            
            var claim = await mediator.Send(new ClaimApplicationOwnershipCommand(id, request.RecruiterIdentity), ct);
            if (claim is null)
            {
                logger.LogWarning("Claim ownership failed: Application {ApplicationId} not found", id);
                return Results.NotFound();
            }

            logger.LogInformation("Recruiter {RecruiterIdentity} successfully claimed application {ApplicationId}", request.RecruiterIdentity, id);
            return Results.Ok(claim);
        })
        .WithName("ClaimApplicationOwnership");

        // POST /api/applications/{id}/ownership/shortlist
        group.MapPost("/{id:guid}/ownership/shortlist", async (Guid id, ShortlistOwnershipRequest request, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            logger.LogInformation("Recruiter {RecruiterIdentity} is shortlisting application {ApplicationId}", request.RecruiterIdentity, id);

            var shortlist = await mediator.Send(new ShortlistApplicationCommand(id, request.RecruiterIdentity, request.Reason), ct);
            if (shortlist is null)
            {
                logger.LogWarning("Shortlist failed: Application {ApplicationId} not found", id);
                return Results.NotFound();
            }

            logger.LogInformation("Recruiter {RecruiterIdentity} successfully shortlisted application {ApplicationId}", request.RecruiterIdentity, id);
            return Results.Ok(shortlist);
        })
        .WithName("ShortlistApplicationOwnership");

        // POST /api/applications/{id}/ownership/accept
        group.MapPost("/{id:guid}/ownership/accept", async (Guid id, AcceptApplicationRequest request, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            logger.LogInformation("Recruiter {RecruiterIdentity} is accepting application {ApplicationId}", request.RecruiterIdentity, id);
            
            var result = await mediator.Send(new AcceptApplicationCommand(id, request.RecruiterIdentity, request.Reason), ct);
            if (result is null) return Results.NotFound();
            
            logger.LogInformation("Recruiter {RecruiterIdentity} successfully accepted application {ApplicationId}", request.RecruiterIdentity, id);
            return Results.Ok(result);
        })
        .WithName("AcceptApplication");

        // POST /api/applications/{id}/ownership/reject
        group.MapPost("/{id:guid}/ownership/reject", async (Guid id, RejectApplicationRequest request, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            logger.LogInformation("Recruiter {RecruiterIdentity} is rejecting application {ApplicationId}", request.RecruiterIdentity, id);
            
            var result = await mediator.Send(new RejectApplicationCommand(id, request.RecruiterIdentity, request.Reason), ct);
            if (result is null) return Results.NotFound();
            
            logger.LogInformation("Recruiter {RecruiterIdentity} successfully rejected application {ApplicationId}", request.RecruiterIdentity, id);
            return Results.Ok(result);
        })
        .WithName("RejectApplication");

        // POST /api/applications/{id}/ownership/rate
        group.MapPost("/{id:guid}/ownership/rate", async (Guid id, RateApplicationRequest request, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            logger.LogInformation("Recruiter {RecruiterIdentity} is rating application {ApplicationId} with {Rating} stars", request.RecruiterIdentity, id, request.Rating);
            
            var result = await mediator.Send(new RateApplicationCommand(id, request.RecruiterIdentity, request.Rating, request.Notes), ct);
            if (result is null) return Results.NotFound();
            
            logger.LogInformation("Recruiter {RecruiterIdentity} successfully rated application {ApplicationId}", request.RecruiterIdentity, id);
            return Results.Ok(result);
        })
        .WithName("RateApplication");

        // POST /api/applications/{id}/ownership/notes
        group.MapPost("/{id:guid}/ownership/notes", async (Guid id, AddNotesRequest request, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            logger.LogInformation("Recruiter {RecruiterIdentity} is adding notes to application {ApplicationId}", request.RecruiterIdentity, id);
            
            var result = await mediator.Send(new AddApplicationNotesCommand(id, request.RecruiterIdentity, request.Notes), ct);
            if (result is null) return Results.NotFound();
            
            logger.LogInformation("Recruiter {RecruiterIdentity} successfully added notes to application {ApplicationId}", request.RecruiterIdentity, id);
            return Results.Ok(result);
        })
        .WithName("AddApplicationNotes");

        // POST /api/applications/{id}/re-evaluate
        group.MapPost("/{id:guid}/re-evaluate", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var success = await mediator.Send(new ReevaluateApplicationCommand(id), ct);
            if (!success)
            {
                return Results.NotFound();
            }

            await IngestEndpoints.NotifyHiringAgent(id);
            return Results.Ok(new { success = true });
        })
        .WithName("ReevaluateApplication");
    }

    public record ClaimOwnershipRequest(string RecruiterIdentity);
    public record ShortlistOwnershipRequest(string RecruiterIdentity, string? Reason);
    public record AcceptApplicationRequest(string RecruiterIdentity, string? Reason);
    public record RejectApplicationRequest(string RecruiterIdentity, string? Reason);
    public record RateApplicationRequest(string RecruiterIdentity, short Rating, string? Notes);
    public record AddNotesRequest(string RecruiterIdentity, string Notes);
}
