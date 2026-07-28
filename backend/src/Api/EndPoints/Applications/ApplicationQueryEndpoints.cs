using Application.Queries.GetApplicantInformation;
using Application.Queries.GetApplicationDetails;
using Application.Queries.GetApplicationLogs;
using Application.Queries.GetApplicationOwnership;
using Application.Queries.GetApplications;
using Application.Queries.GetHardGateScreening;
using Application.Queries.GetHiringAgentEvaluation;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System;
using System.IO;
using System.Linq;
using System.Threading;

namespace Api.EndPoints.Applications;

public static class ApplicationQueryEndpoints
{
    public static void MapApplicationQueryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/applications").WithTags("Applications");

        // GET /api/applications
        group.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            var dtos = await mediator.Send(new GetApplicationsQuery(), ct);
            return Results.Ok(dtos);
        })
        .WithName("GetApplications");

        // GET /api/applications/{id}
        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var application = await mediator.Send(new GetApplicationDetailsQuery(id), ct);
            return application is not null ? Results.Ok(application) : Results.NotFound();
        })
        .WithName("GetApplicationDetails");

        // GET /api/applications/{id}/applicant
        group.MapGet("/{id:guid}/applicant", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var applicant = await mediator.Send(new GetApplicantInformationQuery(id), ct);
            return applicant is not null ? Results.Ok(applicant) : Results.NotFound();
        })
        .WithName("GetApplicantInformation");

        // GET /api/applications/{id}/screening
        group.MapGet("/{id:guid}/screening", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var screening = await mediator.Send(new GetHardGateScreeningQuery(id), ct);
            return screening is not null ? Results.Ok(screening) : Results.NotFound();
        })
        .WithName("GetHardGateScreening");

        // GET /api/applications/{id}/evaluation
        group.MapGet("/{id:guid}/evaluation", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var evaluation = await mediator.Send(new GetHiringAgentEvaluationQuery(id), ct);
            return evaluation is not null ? Results.Ok(evaluation) : Results.NotFound();
        })
        .WithName("GetHiringAgentEvaluation");

        // GET /api/applications/{id}/ownership
        group.MapGet("/{id:guid}/ownership", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var ownership = await mediator.Send(new GetApplicationOwnershipQuery(id), ct);
            return ownership is not null ? Results.Ok(ownership) : Results.NotFound();
        })
        .WithName("GetApplicationOwnership");

        // GET /api/applications/{id}/logs
        group.MapGet("/{id:guid}/logs", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var logs = await mediator.Send(new GetApplicationLogsQuery(id), ct);
            return Results.Ok(logs);
        })
        .WithName("GetApplicationLogs");

        // GET /api/applications/logs
        group.MapGet("/logs", async (IMediator mediator, CancellationToken ct) =>
        {
            var logs = await mediator.Send(new GetApplicationLogsQuery(), ct);
            return Results.Ok(logs);
        })
        .WithName("GetAllApplicationLogs");

        // GET /api/applications/{id}/cv
        group.MapGet("/{id:guid}/cv", async (
            Guid id,
            IApplicationRecordRepository repository,
            IAttachmentRetriever attachmentRetriever,
            CancellationToken ct) =>
        {
            var record = await repository.GetByIdAsync(id, ct);
            if (record?.CvAttachmentId != null)
            {
                try
                {
                    var stream = await attachmentRetriever.GetContentAsync(record.CvAttachmentId, ct);
                    if (stream != null)
                    {
                        return Results.File(stream, "application/pdf", $"{id}_cv.pdf");
                    }
                }
                catch
                {
                    // Fall back to seed documents
                }
            }

            var possiblePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "Data", "SeedDocuments"),
                Path.Combine(Directory.GetCurrentDirectory(), "src", "Infrastructure", "Data", "SeedDocuments"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "Infrastructure", "Data", "SeedDocuments")
            };
            string folder = possiblePaths.FirstOrDefault(Directory.Exists) ?? possiblePaths[0];
            var filePath = Path.Combine(folder, $"{id}_cv.pdf");

            if (!File.Exists(filePath))
            {
                return Results.NotFound("CV not found.");
            }
            return Results.File(filePath, "application/pdf", $"{id}_cv.pdf");
        })
        .WithName("GetApplicationCv");

        // GET /api/applications/{id}/transcript
        group.MapGet("/{id:guid}/transcript", async (
            Guid id,
            IApplicationRecordRepository repository,
            IAttachmentRetriever attachmentRetriever,
            CancellationToken ct) =>
        {
            var record = await repository.GetByIdAsync(id, ct);
            if (record?.TranscriptAttachmentId != null)
            {
                try
                {
                    var stream = await attachmentRetriever.GetContentAsync(record.TranscriptAttachmentId, ct);
                    if (stream != null)
                    {
                        return Results.File(stream, "application/pdf", $"{id}_transcript.pdf");
                    }
                }
                catch
                {
                    // Fall back to seed documents
                }
            }

            var possiblePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "Data", "SeedDocuments"),
                Path.Combine(Directory.GetCurrentDirectory(), "src", "Infrastructure", "Data", "SeedDocuments"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "Infrastructure", "Data", "SeedDocuments")
            };
            string folder = possiblePaths.FirstOrDefault(Directory.Exists) ?? possiblePaths[0];
            var filePath = Path.Combine(folder, $"{id}_transcript.pdf");

            if (!File.Exists(filePath))
            {
                return Results.NotFound("Transcript not found.");
            }
            return Results.File(filePath, "application/pdf", $"{id}_transcript.pdf");
        })
        .WithName("GetApplicationTranscript");
    }
}
