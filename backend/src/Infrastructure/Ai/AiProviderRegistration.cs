
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

public static class AiProviderRegistration
{
    public static IServiceCollection AddAiProvider(
        this IServiceCollection services, IConfiguration config)
    {
        var providerName = config["Ai:Provider"]
            ?? throw new InvalidOperationException("Ai:Provider not configured");

        services.Configure<AzureOpenAiOptions>(config.GetSection("Ai:AzureOpenAI"));
        services.Configure<OllamaOptions>(config.GetSection("Ai:Ollama"));

        services.AddHttpClient<OllamaEvaluationProvider>();
        services.AddSingleton<AzureOpenAiEvaluationProvider>();

        services.AddScoped<IAiEvaluationProvider>(sp => providerName switch
        {
            "AzureOpenAI" => sp.GetRequiredService<AzureOpenAiEvaluationProvider>(),
            "Ollama"      => sp.GetRequiredService<OllamaEvaluationProvider>(),
            _ => throw new InvalidOperationException($"Unknown Ai:Provider '{providerName}'")
        });

        return services;
    }
}