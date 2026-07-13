public interface IAttachmentRetriever
{
    Task<Stream?> GetContentAsync(string attachmentId, CancellationToken ct);
}

public class UrlAttachmentRetriever : IAttachmentRetriever
{
    private readonly HttpClient _httpClient;

    public UrlAttachmentRetriever(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<Stream?> GetContentAsync(string attachmentId, CancellationToken ct)
    {
        var directUrl = ConvertToDirectDownloadUrl(attachmentId);
        return await _httpClient.GetStreamAsync(directUrl, ct);
    }

    private static string ConvertToDirectDownloadUrl(string url)
    {
        // Google Drive share links need translating to the direct-download form:
        // https://drive.google.com/file/d/{FILE_ID}/view?... -> https://drive.google.com/uc?export=download&id={FILE_ID}
        var match = System.Text.RegularExpressions.Regex.Match(url, @"drive\.google\.com/file/d/([^/]+)");
        if (match.Success)
        {
            var fileId = match.Groups[1].Value;
            return $"https://drive.google.com/uc?export=download&id={fileId}";
        }
        return url; // not a Drive share link — pass through unchanged
    }
}