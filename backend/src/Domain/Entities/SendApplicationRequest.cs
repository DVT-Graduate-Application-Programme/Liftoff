using Microsoft.AspNetCore.Http;

public class SendApplicationRequest
{
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
}