using Application.Interfaces;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Net.Http;
using System.Threading;

namespace Api.EndPoints.Applications;

public static class ApplicationEndpoints
{
    private static readonly HttpClient _httpClient = new();
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

        // POST /api/applications/{id}/ownership/shortlist
        // Allows a recruiter to shortlist an application and progress its status
        group.MapPost("/{id:guid}/ownership/shortlist", async (Guid id, ShortlistOwnershipRequest request, IApplicationRecordRepository repo, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.RecruiterIdentity))
            {
                return Results.BadRequest("RecruiterIdentity is required.");
            }

            var shortlist = await repo.ShortlistAsync(id, request.RecruiterIdentity, request.Reason, ct);
            if (shortlist is null)
            {
                return Results.NotFound();
            }

            await repo.SaveChangesAsync(ct);
            return Results.Ok(shortlist);
        })
        .WithName("ShortlistApplicationOwnership");

      
        group.MapGet("/{id:guid}/cv", async (
            Guid id,
            IApplicationRecordRepository repository,
            IAttachmentRetriever attachmentRetriever,
            CancellationToken ct) =>
        {
            var record = await repository.GetByIdAsync(id, ct);
            if (record?.CvAttachmentId is null)
                return Results.NotFound("CV not found for this application.");

            if (Uri.TryCreate(record.CvAttachmentId, UriKind.Absolute, out var uriResult)
                && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps))
            {
                var response = await _httpClient.GetAsync(uriResult, ct);
                if (response.IsSuccessStatusCode)
                {
                    var urlStream = await response.Content.ReadAsStreamAsync(ct);
                    return Results.File(urlStream, "application/pdf");
                }
                return Results.NotFound("CV URL could not be downloaded.");
            }

            var stream = await attachmentRetriever.GetContentAsync(record.CvAttachmentId, ct);
            return stream is null
                ? Results.NotFound("CV attachment could not be retrieved.")
                : Results.File(stream, "application/pdf");
        })
        .WithName("GetApplicationCv");

        group.MapGet("/{id:guid}/transcript", async (
            Guid id,
            IApplicationRecordRepository repository,
            IAttachmentRetriever attachmentRetriever,
            CancellationToken ct) =>
        {
            var record = await repository.GetByIdAsync(id, ct);
            if (record?.TranscriptAttachmentId is null)
                return Results.NotFound("Transcript not found for this application.");

            if (Uri.TryCreate(record.TranscriptAttachmentId, UriKind.Absolute, out var uriResult)
                && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps))
            {
                var response = await _httpClient.GetAsync(uriResult, ct);
                if (response.IsSuccessStatusCode)
                {
                    var urlStream = await response.Content.ReadAsStreamAsync(ct);
                    return Results.File(urlStream, "application/pdf");
                }
                return Results.NotFound("Transcript URL could not be downloaded.");
            }

            var stream = await attachmentRetriever.GetContentAsync(record.TranscriptAttachmentId, ct);
            return stream is null
                ? Results.NotFound("Transcript attachment could not be retrieved.")
                : Results.File(stream, "application/pdf");
        })
        .WithName("GetApplicationTranscript");

        // ── Graph attachment endpoint – disabled for POC ──
        // Fetches a CV/transcript attachment directly from Microsoft Graph using the email
        // message ID stored on the application record. Requires Graph:PollingInbox config.
        //
        // group.MapGet("/{id:guid}/{attachmentId}", async (Guid id, string attachmentId,
        //     IApplicationRecordRepository repo, IGraphEmailService graph,
        //     IConfiguration config, CancellationToken ct) =>
        // {
        //     var application = await repo.GetByIdAsync(id, ct);
        //     if (application is null) return Results.NotFound("Application not found.");
        //
        //     var pollingInbox = config["Graph:PollingInbox"];
        //     if (string.IsNullOrEmpty(pollingInbox))
        //         return Results.Problem("Graph:PollingInbox is not configured on the server.");
        //
        //     var attachment = await graph.GetAttachmentByIdAsync(
        //         pollingInbox, application.EmailMessageId, attachmentId, ct);
        //     if (attachment is null) return Results.NotFound("Attachment not found in Microsoft Graph.");
        //
        //     return Results.File(attachment.ContentBytes, attachment.ContentType, attachment.Name);
        // })
        // .WithName("GetAttachmentById");
    }

    public class ClaimOwnershipRequest
    {
        public string RecruiterIdentity { get; set; } = string.Empty;
    }

    public class ShortlistOwnershipRequest
    {
        public string RecruiterIdentity { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
}
