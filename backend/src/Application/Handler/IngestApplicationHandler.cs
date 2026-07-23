using Application.Requests;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Handler;

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

        var safeCandidateName = string.Concat(request.CandidateName.Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_'));
        if (string.IsNullOrWhiteSpace(safeCandidateName))
        {
            safeCandidateName = "candidate_" + System.Guid.NewGuid().ToString("N");
        }

        // Save CV File
        if (request.CvFile != null && request.CvFile.Length > 0)
        {
            var cvPath = Path.Combine(folder, $"{safeCandidateName}.pdf");
            using (var stream = new FileStream(cvPath, FileMode.Create))
            {
                await request.CvFile.CopyToAsync(stream, token);
            }
        }

        // Save Transcript File
        if (request.TranscriptFile != null && request.TranscriptFile.Length > 0)
        {
            var transcriptPath = Path.Combine(folder, $"{safeCandidateName}_transcript.pdf");
            using (var stream = new FileStream(transcriptPath, FileMode.Create))
            {
                await request.TranscriptFile.CopyToAsync(stream, token);
            }
        }

        return true;
    }
}