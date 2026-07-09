namespace Backend.Application.Queries.GetCandidate;

public class CandidateDto
{
    public int Id { get; set; }

    public string CandidateName { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public string DocumentUrl { get; set; } = string.Empty;

    public string? TranscriptUrl { get; set; }
}