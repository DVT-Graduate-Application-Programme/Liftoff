using System.Threading;
using System.Threading.Tasks;
using Application.Features.IngestApplication;
using Application.Features.SendApplication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Graph.Models;
using Application.Interfaces;
using System.IO;
using System.Linq;

namespace Api.EndPoints.Applications;

public static class IngestEndpoints
{
    private static readonly HttpClient Client = new HttpClient();

    public static IEndpointRouteBuilder MapIngestEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGroup("/api/applications")
         .MapPost("/ingest", IngestAsync)
         .WithName("IngestApplication")
         .DisableAntiforgery();

        return app;
    }

    private static async Task<IResult> IngestAsync(
        [FromForm] global::SendApplicationRequest request,
        HttpRequest httpRequest,
        MediatR.IMediator mediator,
        IRecruiterAssignmentService recruiterAssignmentService,
        CancellationToken ct)
    {
        Stream? cvStream = null;
        Stream? transcriptStream = null;

        try
        {
            // Resolve CV File/URL
            if (httpRequest.Form.Files.GetFile("CvFile") is { } cvFormFile)
            {
                cvStream = cvFormFile.OpenReadStream();
            }
            else if (httpRequest.Form.TryGetValue("CvFile", out var cvUrlValues) &&
                     cvUrlValues.ToString() is { } cvUrl &&
                     !string.IsNullOrWhiteSpace(cvUrl))
            {
                try
                {
                    cvStream = await Client.GetStreamAsync(cvUrl, ct);
                }
                catch (System.Exception ex)
                {
                    return Results.BadRequest($"Failed to download CV from URL: {ex.Message}");
                }
            }
            else
            {
                return Results.BadRequest("CvFile is required (either as an uploaded file or a Google Drive download URL).");
            }

            // Resolve Transcript File/URL
            if (httpRequest.Form.Files.GetFile("TranscriptFile") is { } transcriptFormFile)
            {
                transcriptStream = transcriptFormFile.OpenReadStream();
            }
            else if (httpRequest.Form.TryGetValue("TranscriptFile", out var transcriptUrlValues) &&
                     transcriptUrlValues.ToString() is { } transcriptUrl &&
                     !string.IsNullOrWhiteSpace(transcriptUrl))
            {
                try
                {
                    transcriptStream = await Client.GetStreamAsync(transcriptUrl, ct);
                }
                catch (System.Exception ex)
                {
                    return Results.BadRequest($"Failed to download Transcript from URL: {ex.Message}");
                }
            }

            var command2 = new SendApplicationCommand
            {
                CandidateName = request.CandidateName,
                CandidateEmail = request.CandidateEmail,
                IdempotencyKey = httpRequest.Headers["Idempotency-Key"].ToString(),
                CvStream = cvStream,
                TranscriptStream = transcriptStream
            };

            var result = await mediator.Send(command2, ct);

            if (result is not null && !string.IsNullOrWhiteSpace(result.ApplicationId.ToString()))
            {
                // Application created successfully. The hiring agent is NOT notified from here:
                // SendApplicationHandler has already published the application to the ingest
                // queue, and the worker owns the hand-off. Notifying directly as well would
                // score every application twice — two full LLM evaluations racing to
                // delete-then-insert the same record — and would skip the worker's retry and
                // dead-letter handling for the direct attempt.
                await recruiterAssignmentService.AssignRecruiterAsync(result.ApplicationId, ct);
            }

            return Results.Accepted(value: result);
        }
        finally
        {
            if (cvStream is not null)
            {
                await cvStream.DisposeAsync();
            }
            if (transcriptStream is not null)
            {
                await transcriptStream.DisposeAsync();
            }
        }



    }


}
