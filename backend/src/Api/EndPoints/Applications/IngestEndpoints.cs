using System.Threading;
using System.Threading.Tasks;
using Application.Features.Ingestion;
using Application.Features.SendApplicaton;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Graph.Models;

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
        CancellationToken ct)
    {
        var command = new IngestManualApplicationCommand
        {
            CandidateName = request.CandidateName,
            CandidateEmail = request.CandidateEmail,
            IdempotencyKey = httpRequest.Headers["Idempotency-Key"].ToString(),
            HasCvFile = request.CvFile is not null,
            HasTranscriptFile = request.TranscriptFile is not null
        };

        var command2 = new SendApplicationCommand
        {
            CandidateName = request.CandidateName,
            CandidateEmail = request.CandidateEmail,
            IdempotencyKey = httpRequest.Headers["Idempotency-Key"].ToString(),
            CVurl = request.CvFile,
            TranscriptUrl = request.TranscriptFile
        };

        var result = await mediator.Send(command2, ct);

        if(result is not null && !string.IsNullOrWhiteSpace(result.ApplicationId.ToString()))
        {
            // applciation created successfully
            try
            {
               await NotifyHiringAgent(result.ApplicationId);
            }
            catch (System.Exception)
            {
                
                throw;
            }
        
        }

       
        return Results.Accepted(value: result);
    }


    private static async Task NotifyHiringAgent(Guid applicationId)
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
