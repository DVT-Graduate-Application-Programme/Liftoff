using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

public class IngestApplicationHandler
{
    private readonly IWebHostEnvironment _environment;

    public IngestApplicationHandler(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<bool> HandleAsync(IngestApplicationRequest request, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(request.CandidateName))
            return false;

        var folder = Path.Combine(
            _environment.ContentRootPath,
            "Internal",
            "SampleData",
            "data"
        );

        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }

        // Save CV File
        if (request.CvFile != null && request.CvFile.Length > 0)
        {
            var cvPath = Path.Combine(folder, $"{request.CandidateName}.pdf");
            using (var stream = new FileStream(cvPath, FileMode.Create))
            {
                await request.CvFile.CopyToAsync(stream, token);
            }
        }

        // Save Transcript File
        if (request.TranscriptFile != null && request.TranscriptFile.Length > 0)
        {
            var transcriptPath = Path.Combine(folder, $"{request.CandidateName}_transcript.pdf");
            using (var stream = new FileStream(transcriptPath, FileMode.Create))
            {
                await request.TranscriptFile.CopyToAsync(stream, token);
            }
        }

        return true;
    }
}