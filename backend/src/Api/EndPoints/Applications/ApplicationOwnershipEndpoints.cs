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
        group.MapPost("/{id:guid}/ownership/claim", async (Guid id, ClaimOwnershipRequest request, HttpContext context, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            var recruiterIdentity = ResolveRecruiterIdentity(context, request.RecruiterIdentity);
            logger.LogInformation("Recruiter {RecruiterIdentity} is claiming application {ApplicationId}", recruiterIdentity, id);
            
            var claim = await mediator.Send(new ClaimApplicationOwnershipCommand(id, recruiterIdentity), ct);
            if (claim is null)
            {
                logger.LogWarning("Claim ownership failed: Application {ApplicationId} not found", id);
                return Results.NotFound();
            }

            logger.LogInformation("Recruiter {RecruiterIdentity} successfully claimed application {ApplicationId}", recruiterIdentity, id);
            return Results.Ok(claim);
        })
        .WithName("ClaimApplicationOwnership");

        // POST /api/applications/{id}/ownership/shortlist
        group.MapPost("/{id:guid}/ownership/shortlist", async (Guid id, ShortlistOwnershipRequest request, HttpContext context, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            var recruiterIdentity = ResolveRecruiterIdentity(context, request.RecruiterIdentity);
            logger.LogInformation("Recruiter {RecruiterIdentity} is shortlisting application {ApplicationId}", recruiterIdentity, id);

            var shortlist = await mediator.Send(new ShortlistApplicationCommand(id, recruiterIdentity, request.Reason), ct);
            if (shortlist is null)
            {
                logger.LogWarning("Shortlist failed: Application {ApplicationId} not found", id);
                return Results.NotFound();
            }

            logger.LogInformation("Recruiter {RecruiterIdentity} successfully shortlisted application {ApplicationId}", recruiterIdentity, id);
            return Results.Ok(shortlist);
        })
        .WithName("ShortlistApplicationOwnership");

        // POST /api/applications/{id}/ownership/accept
        group.MapPost("/{id:guid}/ownership/accept", async (Guid id, AcceptApplicationRequest request, HttpContext context, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            var recruiterIdentity = ResolveRecruiterIdentity(context, request.RecruiterIdentity);
            logger.LogInformation("Recruiter {RecruiterIdentity} is accepting application {ApplicationId}", recruiterIdentity, id);
            
            var result = await mediator.Send(new AcceptApplicationCommand(id, recruiterIdentity, request.Reason), ct);
            if (result is null) return Results.NotFound();
            
            logger.LogInformation("Recruiter {RecruiterIdentity} successfully accepted application {ApplicationId}", recruiterIdentity, id);
            return Results.Ok(result);
        })
        .WithName("AcceptApplication");

        // POST /api/applications/{id}/ownership/reject
        group.MapPost("/{id:guid}/ownership/reject", async (Guid id, RejectApplicationRequest request, HttpContext context, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            var recruiterIdentity = ResolveRecruiterIdentity(context, request.RecruiterIdentity);
            logger.LogInformation("Recruiter {RecruiterIdentity} is rejecting application {ApplicationId}", recruiterIdentity, id);
            
            var result = await mediator.Send(new RejectApplicationCommand(id, recruiterIdentity, request.Reason), ct);
            if (result is null) return Results.NotFound();
            
            logger.LogInformation("Recruiter {RecruiterIdentity} successfully rejected application {ApplicationId}", recruiterIdentity, id);
            return Results.Ok(result);
        })
        .WithName("RejectApplication");

        // POST /api/applications/{id}/ownership/rate
        group.MapPost("/{id:guid}/ownership/rate", async (Guid id, RateApplicationRequest request, HttpContext context, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            var recruiterIdentity = ResolveRecruiterIdentity(context, request.RecruiterIdentity);
            logger.LogInformation("Recruiter {RecruiterIdentity} is rating application {ApplicationId} with {Rating} stars", recruiterIdentity, id, request.Rating);
            
            var result = await mediator.Send(new RateApplicationCommand(id, recruiterIdentity, request.Rating, request.Notes), ct);
            if (result is null) return Results.NotFound();
            
            logger.LogInformation("Recruiter {RecruiterIdentity} successfully rated application {ApplicationId}", recruiterIdentity, id);
            return Results.Ok(result);
        })
        .WithName("RateApplication");

        // POST /api/applications/{id}/ownership/notes
        group.MapPost("/{id:guid}/ownership/notes", async (Guid id, AddNotesRequest request, HttpContext context, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            var recruiterIdentity = ResolveRecruiterIdentity(context, request.RecruiterIdentity);
            logger.LogInformation("Recruiter {RecruiterIdentity} is adding notes to application {ApplicationId}", recruiterIdentity, id);
            
            var result = await mediator.Send(new AddApplicationNotesCommand(id, recruiterIdentity, request.Notes), ct);
            if (result is null) return Results.NotFound();
            
            logger.LogInformation("Recruiter {RecruiterIdentity} successfully added notes to application {ApplicationId}", recruiterIdentity, id);
            return Results.Ok(result);
        })
        .WithName("AddApplicationNotes");

        // POST /api/applications/{id}/re-evaluate
        group.MapPost("/{id:guid}/re-evaluate", async (Guid id, IMediator mediator, ILogger<IEndpointRouteBuilder> logger, CancellationToken ct) =>
        {
            var success = await mediator.Send(new ReevaluateApplicationCommand(id), ct);
            if (!success)
            {
                return Results.NotFound();
            }

            // 202, not 200: the handler has cleared the old evaluation and queued the new one,
            // but the scoring itself happens in the worker. The application has no score until
            // that completes, which may be some time later if the hiring agent is down.
            // New status: "REEVALUATING" indicates that the application is in the process of being re-evaluated.
            logger.LogInformation("Application {ApplicationId} queued for re-evaluation", id);
            return Results.Accepted(value: new { success = true, status = "REEVALUATING" });
        })
        .WithName("ReevaluateApplication");
    }

    private static string ResolveRecruiterIdentity(HttpContext context, string requestedIdentity)
    {
        var claimIdentity = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? context.User.Identity?.Name;

        if (!string.IsNullOrWhiteSpace(claimIdentity))
        {
            return claimIdentity;
        }

        var headerIdentity = context.Request.Headers["X-Recruiter-Identity"].ToString();
        if (!string.IsNullOrWhiteSpace(headerIdentity))
        {
            return headerIdentity;
        }

        return requestedIdentity;
    }

    public record ClaimOwnershipRequest(string RecruiterIdentity);
    public record ShortlistOwnershipRequest(string RecruiterIdentity, string? Reason);
    public record AcceptApplicationRequest(string RecruiterIdentity, string? Reason);
    public record RejectApplicationRequest(string RecruiterIdentity, string? Reason);
    public record RateApplicationRequest(string RecruiterIdentity, short Rating, string? Notes);
    public record AddNotesRequest(string RecruiterIdentity, string Notes);
}
