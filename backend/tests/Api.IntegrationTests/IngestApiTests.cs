using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Application.Interfaces;
using Application.Queries.GetDashboardApplications;
using Application.Queries.GetDashboardMetrics;
using Domain.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Text.Json;

namespace Api.IntegrationTests;

public class IngestApiTests : IClassFixture<IngestApiFactory>
{
    private readonly IngestApiFactory _factory;

    public IngestApiTests(IngestApiFactory factory)
    {
        _factory = factory;
        _factory.ResetDatabase();
    }

    [Fact]
    public async Task Ingest_WithSameIdempotencyKey_ReturnsSameApplicationAndCreatesSingleRecord()
    {
        var client = _factory.CreateClient();
        using var firstRequest = CreateIngestRequest("Ada Lovelace", "ada@example.com", includeTranscript: true);
        firstRequest.Headers.Add("Idempotency-Key", "email-message-123");

        using var secondRequest = CreateIngestRequest("Ada Lovelace", "ada@example.com", includeTranscript: true);
        secondRequest.Headers.Add("Idempotency-Key", "email-message-123");

        var firstResponse = await client.SendAsync(firstRequest);
        var secondResponse = await client.SendAsync(secondRequest);

        firstResponse.EnsureSuccessStatusCode();
        secondResponse.EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.Accepted, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, secondResponse.StatusCode);

        var firstResult = await firstResponse.Content.ReadFromJsonAsync<IngestResponse>();
        var secondResult = await secondResponse.Content.ReadFromJsonAsync<IngestResponse>();

        Assert.NotNull(firstResult);
        Assert.NotNull(secondResult);
        Assert.Equal(firstResult.ApplicationId, secondResult.ApplicationId);
        Assert.Equal("PENDING", firstResult.Status);

        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IApplicationRecordRepository>();
        var records = await repository.GetAllAsync();

        var record = Assert.Single(records);
        Assert.Equal(firstResult.ApplicationId, record.Id);
        Assert.Equal("manual:email-message-123", record.EmailMessageId);
        Assert.NotNull(record.CvAttachmentId);
        Assert.NotNull(record.TranscriptAttachmentId);
    }

    [Fact]
    public async Task Ingest_WithDuplicateCandidateEmailWithoutIdempotencyKey_ReturnsExistingApplication()
    {
        var client = _factory.CreateClient();
        using var firstRequest = CreateIngestRequest("Grace Hopper", "Grace.Hopper@example.com", includeTranscript: true);
        using var duplicateRequest = CreateIngestRequest("Rear Admiral Hopper", " grace.hopper@example.com ", includeTranscript: true);

        var firstResponse = await client.SendAsync(firstRequest);
        var duplicateResponse = await client.SendAsync(duplicateRequest);

        firstResponse.EnsureSuccessStatusCode();
        duplicateResponse.EnsureSuccessStatusCode();

        var firstResult = await firstResponse.Content.ReadFromJsonAsync<IngestResponse>();
        var duplicateResult = await duplicateResponse.Content.ReadFromJsonAsync<IngestResponse>();

        Assert.NotNull(firstResult);
        Assert.NotNull(duplicateResult);
        Assert.Equal(firstResult.ApplicationId, duplicateResult.ApplicationId);

        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IApplicationRecordRepository>();
        var record = Assert.Single(await repository.GetAllAsync());

        Assert.Equal("Grace.Hopper@example.com", record.CandidateEmail);
        Assert.Equal("manual:grace.hopper@example.com", record.EmailMessageId);
    }

    [Fact]
    public async Task Ingest_WithoutTranscriptAttachment_AcceptsApplicationAndLeavesTranscriptAttachmentEmpty()
    {
        var client = _factory.CreateClient();
        using var request = CreateIngestRequest("Katherine Johnson", "katherine@example.com", includeTranscript: false);

        var response = await client.SendAsync(request);

        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<IngestResponse>();
        Assert.NotNull(result);
        Assert.Equal("PENDING", result.Status);

        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IApplicationRecordRepository>();
        var record = Assert.Single(await repository.GetAllAsync());

        Assert.Equal(result.ApplicationId, record.Id);
        Assert.NotNull(record.CvAttachmentId);
        Assert.Null(record.TranscriptAttachmentId);
    }

    [Fact]
    public async Task Ingest_WithInvalidCandidateEmail_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        using var request = CreateIngestRequest("Invalid Candidate", "not-an-email", includeTranscript: false);

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static HttpRequestMessage CreateIngestRequest(
        string candidateName,
        string candidateEmail,
        bool includeTranscript)
    {
        var content = new MultipartFormDataContent
        {
            { new StringContent(candidateName), "CandidateName" },
            { new StringContent(candidateEmail), "CandidateEmail" },
            { CreatePdfContent("CV"), "CvFile", "cv.pdf" }
        };

        if (includeTranscript)
        {
            content.Add(CreatePdfContent("Transcript"), "TranscriptFile", "transcript.pdf");
        }

        return new HttpRequestMessage(HttpMethod.Post, "/api/applications/ingest")
        {
            Content = content
        };
    }

    private static ByteArrayContent CreatePdfContent(string text)
    {
        var content = new ByteArrayContent(Encoding.UTF8.GetBytes(text));
        content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        return content;
    }

    private sealed record IngestResponse(Guid ApplicationId, string Status);
}

public sealed class IngestApiFactory : WebApplicationFactory<Program>
{
    private readonly TestApplicationRecordRepository _repository = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Environment.SetEnvironmentVariable("POSTGRES_HOST", "localhost");
        Environment.SetEnvironmentVariable("POSTGRES_PORT", "5432");
        Environment.SetEnvironmentVariable("POSTGRES_DB", "test");
        Environment.SetEnvironmentVariable("POSTGRES_USER", "test");
        Environment.SetEnvironmentVariable("POSTGRES_PASSWORD", "test");

        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IApplicationRecordRepository>();
            services.AddSingleton<IApplicationRecordRepository>(_repository);
        });
    }

    public void ResetDatabase()
    {
        _repository.Clear();
    }
}

internal sealed class TestApplicationRecordRepository : IApplicationRecordRepository
{
    private readonly List<ApplicationRecord> _records = [];

    public Task<List<ApplicationRecord>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_records.OrderByDescending(record => record.CreatedAt).ToList());
    }

    public Task<ApplicationRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_records.FirstOrDefault(record => record.Id == id));
    }

    public Task<ApplicationRecord?> GetByEmailMessageIdAsync(string emailMessageId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_records.FirstOrDefault(record => record.EmailMessageId == emailMessageId));
    }

    public Task AddAsync(ApplicationRecord record, CancellationToken cancellationToken = default)
    {
        if (record.Id == Guid.Empty)
        {
            record.Id = Guid.NewGuid();
        }

        _records.Add(record);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public void Clear()
    {
        _records.Clear();
    }

    public Task<Applicant?> GetApplicantByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<ApplicationDetails?> GetApplicationDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<ApplicationHardGateScreening?> GetHardGateScreeningByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<HiringAgentEvaluation?> GetHardGateEvaluationByApplicationIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<ApplicationOwnership?> GetOwnershipAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<ApplicationOwnershipClaim?> ClaimOwnershipAsync(Guid id, string recruiterIdentity, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<ApplicationOwnershipShortlist?> ShortlistAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<List<DashboardApplicationDto>> GetDashboardApplicationsAsync(GetDashboardApplicationsQuery query, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<bool> ExistsAsync(string emailMessageId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_records.Any(record => record.EmailMessageId == emailMessageId));
    }

    public Task<bool> AddEvaluationAsync(
        Guid applicationId,
        HiringAgentEvaluation evaluation,
        string status,
        decimal totalScore,
        string tier,
        bool hardGatePassed,
        string hardGateReason,
        string? cvSummary,
        JsonDocument? flagsJson,
        CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task AddAuditLogAsync(AuditLog auditLog, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException();
    }

    public Task<ApplicationStatusUpdate?> AcceptAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<ApplicationStatusUpdate?> RejectAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<ApplicationRatingUpdate?> RateAsync(Guid id, string recruiterIdentity, short rating, string? notes, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<ApplicationRatingUpdate?> AddNotesAsync(Guid id, string recruiterIdentity, string notes, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<List<RecruiterActionLogDto>> GetRecruiterLogsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<List<RecruiterActionLogDto>> GetAllRecruiterLogsAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task<List<Recruiter>> GetRecruitersAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<Recruiter>());
    }

    public Task AddRecruiterAsync(RecruiterPostDto recruiter, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<bool> ResetEvaluationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }
}
