using MediatR;
using Application.Queries.GetDashboardApplications;
using Application.Queries.GetDashboardMetrics;

namespace Api.EndPoints.Applications;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard");

        group.MapGet("/applications", async (
            IMediator mediator,
            string? status,
            string? tier,
            bool? hardGatePassed,
            bool? isClaimed,
            bool? isShortlisted,
            DateTime? fromDate,
            DateTime? toDate) =>
        {
            var query = new GetDashboardApplicationsQuery
            {
                Status        = status,
                Tier          = tier,
                HardGatePassed= hardGatePassed,
                IsClaimed     = isClaimed,
                IsShortlisted = isShortlisted,
                FromDate      = fromDate,
                ToDate        = toDate
            };

            var results = await mediator.Send(query);
            return Results.Ok(new { applications = results });
        })
        .WithName("GetDashboardApplications");

        group.MapGet("/metrics", async (IMediator mediator) =>
        {
            var metrics = await mediator.Send(new GetDashboardMetricsQuery());
            return Results.Ok(metrics);
        })
        .WithName("GetDashboardMetrics");
    }
}