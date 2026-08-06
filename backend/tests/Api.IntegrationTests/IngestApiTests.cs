using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Application.Interfaces;
using Application.Features.GetDashboardApplications;
using Application.Features.GetDashboardMetrics;
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
        Assert.Equal(HttpStatusCode.Accepted, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, secondResponse.StatusCode);

        var firstResult = await firstResponse.Content.ReadFromJsonAsync<IngestResponse>();
        Assert.NotNull(firstResult);
        Assert.Equal("PROCESSING", firstResult.Status);

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
        Assert.Equal(HttpStatusCode.Accepted, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, duplicateResponse.StatusCode);

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
    public async Task Ingest_WithDuplicateCandidateEmailAndDifferentIdempotencyKey_ReturnsExistingApplication()
    {
        var client = _factory.CreateClient();
        using var firstRequest = CreateIngestRequest("Grace Hopper", "Grace.Hopper@example.com", includeTranscript: true);
        firstRequest.Headers.Add("Idempotency-Key", "custom-key-1");

        using var duplicateRequest = CreateIngestRequest("Rear Admiral Hopper", " grace.hopper@example.com ", includeTranscript: true);
        duplicateRequest.Headers.Add("Idempotency-Key", "custom-key-2");

        var firstResponse = await client.SendAsync(firstRequest);
        var duplicateResponse = await client.SendAsync(duplicateRequest);

        firstResponse.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Accepted, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, duplicateResponse.StatusCode);

        var firstResult = await firstResponse.Content.ReadFromJsonAsync<IngestResponse>();
        var duplicateResult = await duplicateResponse.Content.ReadFromJsonAsync<IngestResponse>();

        Assert.NotNull(firstResult);
        Assert.NotNull(duplicateResult);
        Assert.Equal(firstResult.ApplicationId, duplicateResult.ApplicationId);

        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IApplicationRecordRepository>();
        var record = Assert.Single(await repository.GetAllAsync());

        Assert.Equal("Grace.Hopper@example.com", record.CandidateEmail);
        Assert.Equal("manual:custom-key-1", record.EmailMessageId);
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
        Assert.Equal("PROCESSING", result.Status);

        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IApplicationRecordRepository>();
        var record = Assert.Single(await repository.GetAllAsync());

        Assert.Equal(result.ApplicationId, record.Id);
        Assert.NotNull(record.CvAttachmentId);
        Assert.Null(record.TranscriptAttachmentId);
    }

    [Fact]
    public async Task IngestedApplication_HasPendingStatus()
    {
        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IApplicationRecordRepository>();

        var pendingRecord = new ApplicationRecord(
            id: Guid.NewGuid(),
            emailMessageId: "test-msg-queue-1",
            candidateName: "Worker Test",
            candidateEmail: "worker-test@example.com",
            status: "PENDING",
            createdAt: DateTimeOffset.UtcNow);

        await repository.AddAsync(pendingRecord);

        var retrieved = await repository.GetByIdAsync(pendingRecord.Id);

        Assert.NotNull(retrieved);
        Assert.Equal(pendingRecord.Id, retrieved.Id);
        Assert.Equal("PENDING", retrieved.Status);
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

    private static ByteArrayContent CreatePdfContent(string label)
    {
        var bytes = Encoding.UTF8.GetBytes($"%PDF-1.7 Fake PDF Content for {label}");
        var content = new ByteArrayContent(bytes);
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
        Environment.SetEnvironmentVariable("SERVICEBUS_CONNECTION_STRING", "Endpoint=sb://localhost/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=123");
        // AddInfrastructure refuses to start without one; the registration is replaced below,
        // so no emulator has to be running for these tests.
        Environment.SetEnvironmentVariable("STORAGE_CONNECTION_STRING", "UseDevelopmentStorage=true");

        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IApplicationRecordRepository>();
            services.AddSingleton<IApplicationRecordRepository>(_repository);

            services.RemoveAll<IApplicationQueuePublisher>();
            services.AddSingleton<IApplicationQueuePublisher, TestQueuePublisher>();

            services.RemoveAll<IDocumentStorage>();
            services.AddSingleton<IDocumentStorage, InMemoryDocumentStorage>();

            services.RemoveAll<IRecruiterRepository>();
            services.AddSingleton<IRecruiterRepository, TestRecruiterRepository>();
        });
    }

    public void ResetDatabase()
    {
        _repository.Clear();
    }
}

/// <summary>
/// Stands in for blob storage so the ingest tests need no emulator. Mirrors the real
/// reference format so anything asserting on the stored reference stays meaningful.
/// </summary>
internal sealed class InMemoryDocumentStorage : IDocumentStorage
{
    private const string ReferenceScheme = "blob://";

    private readonly Dictionary<string, byte[]> _documents = [];

    public async Task<string> SaveAsync(
        DocumentKind kind,
        Guid applicationId,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);

        var reference = kind == DocumentKind.Cv
            ? $"{ReferenceScheme}cvs/{applicationId}_cv.pdf"
            : $"{ReferenceScheme}transcripts/{applicationId}_transcript.pdf";

        lock (_documents)
        {
            _documents[reference] = buffer.ToArray();
        }

        return reference;
    }

    public Task<Stream?> GetAsync(string reference, CancellationToken cancellationToken = default)
    {
        lock (_documents)
        {
            return Task.FromResult<Stream?>(
                _documents.TryGetValue(reference, out var bytes) ? new MemoryStream(bytes) : null);
        }
    }

    public bool OwnsReference(string reference) =>
        reference.StartsWith(ReferenceScheme, StringComparison.OrdinalIgnoreCase);
}

internal sealed class TestQueuePublisher : IApplicationQueuePublisher
{
    public Task PublishAsync(Domain.Messaging.CvProcessingMessage message, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}

internal sealed class TestRecruiterRepository : IRecruiterRepository
{
    public Task<Recruiter?> GetRecruiters(CancellationToken cancellationToken = default) => Task.FromResult<Recruiter?>(null);
    public Task<List<Recruiter>> GetRecruitersAsync(CancellationToken cancellationToken = default) => Task.FromResult(new List<Recruiter>());
    public Task AddRecruiterAsync(RecruiterPostDto recruiter, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

   public Task<IReadOnlyList<Recruiter>> GetActiveRecruiters(CancellationToken cancellationToken = default) 
        => Task.FromResult<IReadOnlyList<Recruiter>>(new List<Recruiter>());
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

    public Task<ApplicationRecord?> GetByCandidateEmailAsync(string candidateEmail, CancellationToken cancellationToken = default)
    {
        var normalizedCandidateEmail = candidateEmail.Trim().ToLowerInvariant();
        return Task.FromResult(_records.FirstOrDefault(record => record.CandidateEmail != null && record.CandidateEmail.Trim().ToLowerInvariant() == normalizedCandidateEmail));
    }

    public Task AddAsync(ApplicationRecord record, CancellationToken cancellationToken = default)
    {
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

    public Task<bool> ExistsAsync(string emailMessageId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_records.Any(record => record.EmailMessageId == emailMessageId));
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

    public Task<string?> GetLastAssignedRecruiterIdentityAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<string?>(null);
    }
}
