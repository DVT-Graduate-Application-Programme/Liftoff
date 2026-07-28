using Application.Ai;
using Application.Common.Behaviors;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Reflection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient<IAttachmentClassificationService, OllamaAttachmentClassificationService>(client =>
        {
            var ollamaBaseUrl = configuration["Ollama:BaseUrl"] ?? "http://localhost:11434";
            client.BaseAddress = new Uri(ollamaBaseUrl);
        });

        var assembly = Assembly.GetExecutingAssembly();
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        services.AddTransient<Application.Evaluation.IHardGateEvaluationStrategy, Application.Evaluation.Strategies.FormalEducationHardGateStrategy>();
        services.AddTransient<Application.Evaluation.IHardGateEvaluationStrategy, Application.Evaluation.Strategies.SelfTaughtHardGateStrategy>();
        services.AddTransient<Application.Evaluation.IHardGateEvaluationStrategy, Application.Evaluation.Strategies.UnrelatedEducationHardGateStrategy>();
        services.AddTransient<Application.Evaluation.IHardGateEvaluator, Application.Evaluation.HardGateEvaluator>();

        return services;
    }
}
