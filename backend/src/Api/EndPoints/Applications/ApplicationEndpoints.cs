using Application.Interfaces;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading;

namespace Api.EndPoints.Applications;

public static class ApplicationEndpoints
{
    public static void MapApplicationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/applications").WithTags("Applications");

        // GET /api/applications
        // Returns a list of all application records
        group.MapGet("/", async (IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            var applications = await repo.GetAllAsync(ct);
            return Results.Ok(applications);
        })
        .WithName("GetApplications");

        // GET /api/applications/{id}
        // Returns the full application details for a given application ID
        group.MapGet("/{id:guid}", async (Guid id, IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            var application = await repo.GetApplicationDetailsAsync(id, ct);
            return application is not null ? Results.Ok(application) : Results.NotFound();
        })
        .WithName("GetApplicationDetails");

        // GET /api/applications/{id}/applicant
        // Returns the applicant's personal information for a given application ID
        group.MapGet("/{id:guid}/applicant", async (Guid id, IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            var applicant = await repo.GetApplicantByApplicationIdAsync(id, ct);
            return applicant is not null ? Results.Ok(applicant) : Results.NotFound();
        })
        .WithName("GetApplicantInformation");

        // GET /api/applications/{id}/screening
        // Returns the hard gate screening result for a given application ID
        group.MapGet("/{id:guid}/screening", async (Guid id, IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            var screening = await repo.GetHardGateScreeningByApplicationIdAsync(id, ct);
            return screening is not null ? Results.Ok(screening) : Results.NotFound();
        })
        .WithName("GetHardGateScreening");

        // GET /api/applications/{id}/evaluation
        // Returns the hiring agent evaluation for a given application ID
        group.MapGet("/{id:guid}/evaluation", async (Guid id, IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            var evaluation = await repo.GetHardGateEvaluationByApplicationIdAsync(id, ct);
            return evaluation is not null ? Results.Ok(evaluation) : Results.NotFound();
        })
        .WithName("GetHiringAgentEvaluation");

        // GET /api/applications/{id}/ownership
        // Returns recruiter ownership, shortlist, and rating details for a given application
        group.MapGet("/{id:guid}/ownership", async (Guid id, IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            var ownership = await repo.GetOwnershipAsync(id, ct);
            return ownership is not null ? Results.Ok(ownership) : Results.NotFound();
        })
        .WithName("GetApplicationOwnership");

        // POST /api/applications/{id}/ownership/claim
        // Allows a recruiter to claim ownership of an application
        group.MapPost("/{id:guid}/ownership/claim", async (Guid id, ClaimOwnershipRequest request, IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.RecruiterIdentity))
            {
                return Results.BadRequest("RecruiterIdentity is required.");
            }

            var claim = await repo.ClaimOwnershipAsync(id, request.RecruiterIdentity, ct);
            if (claim is null)
            {
                return Results.NotFound();
            }

            await repo.SaveChangesAsync(ct);
            return Results.Ok(claim);
        })
        .WithName("ClaimApplicationOwnership");

        // GET /api/applications/{id}/{attachmentId}
        // Downloads a specific email attachment from Microsoft Graph for a given application
        group.MapGet("/{id:guid}/{attachmentId}", async (Guid id, string attachmentId, IApplicationRecordRepository repo, IGraphEmailService graph, IConfiguration config, CancellationToken ct) =>
        {
            var application = await repo.GetByIdAsync(id, ct);
            if (application is null) return Results.NotFound("Application not found.");

            var pollingInbox = config["Graph:PollingInbox"];
            if (string.IsNullOrEmpty(pollingInbox)) return Results.Problem("Graph:PollingInbox is not configured on the server.");

            var attachment = await graph.GetAttachmentByIdAsync(pollingInbox, application.EmailMessageId, attachmentId, ct);
            if (attachment is null) return Results.NotFound("Attachment not found in Microsoft Graph.");

            return Results.File(attachment.ContentBytes, attachment.ContentType, attachment.Name);
        })
        .WithName("GetAttachmentById");
    }

    public class ClaimOwnershipRequest
    {
        public string RecruiterIdentity { get; set; } = string.Empty;
    }
}
