namespace Backend.Application.Queries.GetResumeDocument;

public class ResumeDocumentDto
{
    public Stream Content { get; set; } = Stream.Null;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
}