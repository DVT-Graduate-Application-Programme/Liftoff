using Microsoft.AspNetCore.Http;

public class IngestApplicationRequest
{
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public IFormFile? CvFile { get; set; }
    public IFormFile? TranscriptFile { get; set; }
}