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
        group.MapGet("/", async (IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            var applications = await repo.GetAllAsync(ct);
            return Results.Ok(applications);
        })
        .WithName("GetApplications");

        // GET /api/applications/{id}
        group.MapGet("/{id:guid}", async (Guid id, IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            var application = await repo.GetByIdAsync(id, ct);
            return application is not null ? Results.Ok(application) : Results.NotFound();
        })
        .WithName("GetApplication");

        // GET /api/applications/{id}/attachments/{attachmentId}
        group.MapGet("/{id:guid}/attachments/{attachmentId}", async (Guid id, string attachmentId, IApplicationRecordRepository repo, IGraphEmailService graph, IConfiguration config, CancellationToken ct) =>
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
}
