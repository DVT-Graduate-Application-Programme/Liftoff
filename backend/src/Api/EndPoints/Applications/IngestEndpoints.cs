using System.Threading;
using System.Threading.Tasks;
using Application.Features.IngestApplication;
using Application.Features.SendApplicaton;
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
                  // applciation created successfully
                try
                {
                    await NotifyHiringAgent(result.ApplicationId);
                    // assign recruiter
                    await recruiterAssignmentService.AssignRecruiterAsync(result.ApplicationId, ct);
                }
                catch (System.Exception)
                {

                    throw;
                }
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


    public static async Task NotifyHiringAgent(Guid applicationId)
    {
        const string fastApiBaseUrl = "http://hiring-agent:8001";
        try
        {
            var payload = new { candidate_id = applicationId };
            HttpResponseMessage response = await Client.PostAsJsonAsync($"{fastApiBaseUrl}/notify", payload);
            response.EnsureSuccessStatusCode();
            string responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Hiring agent notified: {responseBody}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to notify hiring agent: {ex.Message}");
            // swallow — don't let a notify failure crash ingest
        }
    }
}
