using Application.Ai;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient<IAttachmentClassificationService, OllamaAttachmentClassificationService>(client =>
        {
            var ollamaBaseUrl = configuration["Ollama__BaseUrl"] ?? "http://localhost:11434";
            client.BaseAddress = new Uri(ollamaBaseUrl);
        });

        // Other MediatR or Application registrations here
        
        return services;
    }
}
