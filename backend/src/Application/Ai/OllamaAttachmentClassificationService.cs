using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using UglyToad.PdfPig;

namespace Application.Ai;

public class OllamaAttachmentClassificationService : IAttachmentClassificationService
{
    private readonly HttpClient _httpClient;

    public OllamaAttachmentClassificationService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string> ClassifyAttachmentAsync(byte[] fileBytes, string fileName, string mimeType, CancellationToken token = default)
    {
        // First try to classify by file name rules (fast and cheap)
        var nameLower = fileName.ToLowerInvariant();
        if (nameLower.Contains("resume") || nameLower.Contains("cv"))
        {
            return "CV";
        }
        if (nameLower.Contains("transcript") || nameLower.Contains("results") || nameLower.Contains("academic"))
        {
            return "Transcript";
        }

        // If unclear, extract text and use AI
        var text = ExtractText(fileBytes, mimeType);
        if (string.IsNullOrWhiteSpace(text))
        {
            return "Unknown";
        }

        // Truncate to first 2000 chars to save AI processing time
        if (text.Length > 2000)
        {
            text = text.Substring(0, 2000);
        }

        var prompt = $@"You are a recruitment assistant analyzing an attachment.
Determine if the following text is from a 'CV/Resume' or an 'Academic Transcript'.
Reply with exactly one word: either 'CV' or 'Transcript'. If you are unsure, reply 'Unknown'.

Text:
{text}";

        var requestBody = new
        {
            model = "gemma3:4b", // As specified in docker-compose.yml
            prompt = prompt,
            stream = false
        };

        var response = await _httpClient.PostAsJsonAsync("/api/generate", requestBody, token);
        if (!response.IsSuccessStatusCode)
        {
            return "Unknown";
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: token);
        var responseText = result.GetProperty("response").GetString()?.Trim() ?? string.Empty;

        if (responseText.Contains("CV", StringComparison.OrdinalIgnoreCase) || responseText.Contains("Resume", StringComparison.OrdinalIgnoreCase))
            return "CV";
        
        if (responseText.Contains("Transcript", StringComparison.OrdinalIgnoreCase))
            return "Transcript";

        return "Unknown";
    }

    private string ExtractText(byte[] fileBytes, string mimeType)
    {
        if (mimeType != "application/pdf")
        {
            // For now, only extract PDF. Word extraction could be added here (e.g. OpenXML).
            return string.Empty; 
        }

        try
        {
            using var document = PdfDocument.Open(fileBytes);
            var sb = new StringBuilder();
            // Read first 2 pages
            int pagesToRead = Math.Min(2, document.NumberOfPages);
            for (int i = 1; i <= pagesToRead; i++)
            {
                var page = document.GetPage(i);
                sb.AppendLine(page.Text);
            }
            return sb.ToString();
        }
        catch
        {
            return string.Empty;
        }
    }
}
