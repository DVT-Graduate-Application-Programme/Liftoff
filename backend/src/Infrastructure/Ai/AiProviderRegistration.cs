
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;

public static class AiProviderRegistration
{
    public static IServiceCollection AddAiProvider(this IServiceCollection services, IConfiguration config)
    {
        var providerName = config["Ai:Provider"] ?? throw new InvalidOperationException("Ai:Provider not configured");

        // services.Configure<OllamaOptions>(config.GetSection("Ai:Ollama"));

        // services.AddHttpClient<OllamaEvaluationProvider>();

        // services.AddScoped<IAiEvaluationProvider>(sp => providerName switch
        // {
        //     "Ollama"      => sp.GetRequiredService<OllamaEvaluationProvider>(),
        //     _ => throw new InvalidOperationException($"Unknown Ai:Provider '{providerName}'")
        // });

        return services;
    }
}