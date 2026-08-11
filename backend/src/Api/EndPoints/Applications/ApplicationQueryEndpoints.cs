using Application.Features.GetApplicantInformation;
using Application.Features.GetApplicationDetails;
using Application.Features.GetApplicationLogs;
using Application.Features.GetApplicationOwnership;
using Application.Features.GetApplications;
using Application.Features.GetApplicationTechnicalRating;
using Application.Features.GetHardGateScreening;
using Application.Features.GetHiringAgentEvaluation;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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

        group.MapGet("/{id:guid}/rating", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            var rating = await mediator.Send(new GetApplicationTechnicalRatingQuery(id), ct);
            return rating is not null ? Results.Ok(rating) : Results.NotFound();
        })
        .WithName("GetApplicationRating");

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
            IDocumentStorage documentStorage,
            IAttachmentRetriever attachmentRetriever,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var record = await repository.GetByIdAsync(id, ct);

            return await ServeDocumentAsync(
                record?.CvAttachmentId,
                $"{id}_cv.pdf",
                "CV",
                documentStorage,
                attachmentRetriever,
                loggerFactory,
                ct);
        })
        .WithName("GetApplicationCv");

        // GET /api/applications/{id}/transcript
        group.MapGet("/{id:guid}/transcript", async (
            Guid id,
            IApplicationRecordRepository repository,
            IDocumentStorage documentStorage,
            IAttachmentRetriever attachmentRetriever,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var record = await repository.GetByIdAsync(id, ct);

            return await ServeDocumentAsync(
                record?.TranscriptAttachmentId,
                $"{id}_transcript.pdf",
                "Transcript",
                documentStorage,
                attachmentRetriever,
                loggerFactory,
                ct);
        })
        .WithName("GetApplicationTranscript");
    }

    /// <summary>
    /// Resolves a stored attachment reference. Uploads live in blob storage; references
    /// predating that (share URLs) still resolve through the URL retriever. The seed-document
    /// fallback covers only the sample PDFs baked into the image for local demos.
    /// </summary>
    private static async Task<IResult> ServeDocumentAsync(
        string? attachmentReference,
        string downloadFileName,
        string documentLabel,
        IDocumentStorage documentStorage,
        IAttachmentRetriever attachmentRetriever,
        ILoggerFactory loggerFactory,
        CancellationToken ct)
    {
        var logger = loggerFactory.CreateLogger("Api.ApplicationDocuments");

        if (!string.IsNullOrWhiteSpace(attachmentReference))
        {
            try
            {
                var stream = documentStorage.OwnsReference(attachmentReference)
                    ? await documentStorage.GetAsync(attachmentReference, ct)
                    : await attachmentRetriever.GetContentAsync(attachmentReference, ct);

                if (stream != null)
                {
                    return Results.File(stream, "application/pdf", downloadFileName);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(
                    ex,
                    "Failed to retrieve {DocumentLabel} from {Reference}; falling back to seed documents.",
                    documentLabel,
                    attachmentReference);
            }
        }

        var possiblePaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Data", "SeedDocuments"),
            Path.Combine(Directory.GetCurrentDirectory(), "src", "Infrastructure", "Data", "SeedDocuments"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "Infrastructure", "Data", "SeedDocuments")
        };
        string folder = possiblePaths.FirstOrDefault(Directory.Exists) ?? possiblePaths[0];
        var filePath = Path.Combine(folder, downloadFileName);

        if (!File.Exists(filePath))
        {
            return Results.NotFound($"{documentLabel} not found.");
        }

        return Results.File(filePath, "application/pdf", downloadFileName);
    }
}
