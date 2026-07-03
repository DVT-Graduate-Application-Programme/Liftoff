public interface IAiEvaluationProvider
{
    Task<RawProviderResponse> EvaluateAsync(EvaluationRequest request, CancellationToken cancellationToken);
}

public sealed record RawProviderResponse(string RawJson,int? PromptTokens,int? CompletionTokens,TimeSpan Latency,string ProviderName);   // "AzureOpenAI" | "Ollama" — for audit/logging only