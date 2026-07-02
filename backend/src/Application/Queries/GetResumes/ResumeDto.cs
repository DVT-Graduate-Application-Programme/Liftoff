namespace Backend.Application.Queries.GetResumes;

public class ResumeDto
{
    public int Id { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
}