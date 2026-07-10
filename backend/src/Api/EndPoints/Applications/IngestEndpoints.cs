using System.Threading;
using System.Threading.Tasks;
using Application.Features.Ingestion;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Net.Http;
using System.Net.Http.Json; 

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

    private static async Task<IResult> IngestAsync(global::IngestApplicationRequest request, MediatR.IMediator mediator, CancellationToken ct)
    {
        var command = new IngestManualApplicationCommand
        {
            CandidateName = request.CandidateName,
            CandidateEmail = request.CandidateEmail,
            HasCvFile = request.CvFile is not null,
            HasTranscriptFile = request.TranscriptFile is not null
        };

        var result = await mediator.Send(command, ct);

        if(result is not null && !string.IsNullOrWhiteSpace(result.ApplicationId.ToString()))
        {
            // applciation created successfully
            // call python
            try
            {
                NotifyHiringAgent(result.ApplicationId);
            }
            catch (System.Exception)
            {
                
                throw;
            }
        
        }

       
        return Results.Accepted(value: result);
    }


    private async static void NotifyHiringAgent(Guid guid)
    {
        const string fastAPI = "localhost:1000";
        try
        {
            const string queueUrl = $"{fastAPI}/applications/new";
            HttpResponseMessage response = await Client.PostAsJsonAsync(queueUrl, guid);

            // Ensure we get a successful status code (200-299)
            response.EnsureSuccessStatusCode();

            // Read the response content as a string
            string responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine("Application received:");            
        }
        catch (System.Exception)
        {
        
            throw;
        }
    }

}
