using Application.Interfaces;
using Application.Features.GetDashboardApplications;
using Application.Features.GetDashboardMetrics;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Data;

public class DashboardQueryService : IDashboardQueryService
{
    private readonly GradRecruitmentDbContext _dbContext;

    public DashboardQueryService(GradRecruitmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<DashboardApplicationDto>> GetDashboardApplicationsAsync(
        GetDashboardApplicationsQuery query,
        CancellationToken cancellationToken = default)
    {
        var records = _dbContext.ApplicationRecords.AsNoTracking();

        if (query.Status is not null)
        {
            records = records.Where(a => a.Status == query.Status);
        }

        if (query.Tier is not null)
        {
            records = records.Where(a => a.Tier == query.Tier);
        }

        if (query.HardGatePassed is not null)
        {
            records = records.Where(a => a.HardGatePassed == query.HardGatePassed);
        }

        if (query.IsClaimed is not null)
        {
            records = query.IsClaimed.Value
                ? records.Where(a => a.ClaimedByRecruiterId != null)
                : records.Where(a => a.ClaimedByRecruiterId == null);
        }

        if (query.IsShortlisted is not null)
        {
            records = query.IsShortlisted.Value
                ? records.Where(a => a.ShortlistedByRecruiterId != null)
                : records.Where(a => a.ShortlistedByRecruiterId == null);
        }

        if (query.RecruiterIdentity is not null)
        {
            records = records.Where(a =>
                a.ClaimedByRecruiterId == query.RecruiterIdentity ||
                a.ShortlistedByRecruiterId == query.RecruiterIdentity ||
                a.RatedByRecruiterId == query.RecruiterIdentity);
        }

        if (query.FromDate is not null)
        {
            var fromDate = new DateTimeOffset(DateTime.SpecifyKind(query.FromDate.Value, DateTimeKind.Utc));
            records = records.Where(a => a.CreatedAt >= fromDate);
        }

        if (query.ToDate is not null)
        {
            var toDate = new DateTimeOffset(DateTime.SpecifyKind(query.ToDate.Value, DateTimeKind.Utc));
            records = records.Where(a => a.CreatedAt <= toDate);
        }

        var dashboardRecords = await records
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.CandidateName,
                a.Status,
                a.Tier,
                a.HardGatePassed,
                a.HiringAgentTotalScore,
                a.CvSummary,
                a.FlagsJson,
                a.CandidateGitHubUrl,
                a.ClaimedByRecruiterId,
                a.ShortlistedByRecruiterId,
                a.RecruiterRating,
                a.CreatedAt,
                LatestEvaluation = a.HiringAgentEvaluations
                    .OrderByDescending(e => e.ProcessedAt)
                    .Select(e => new { e.InstitutionJson, e.CategoryScoresJson })
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return dashboardRecords
            .Select(a => new DashboardApplicationDto
            {
                ApplicationId = a.Id.ToString(),
                CandidateName = a.CandidateName ?? string.Empty,
                CurrentStatus = a.Status,
                Tier = a.Tier ?? string.Empty,
                HardGatePassed = a.HardGatePassed ?? false,
                HiringAgentTotalScore = (double)(a.HiringAgentTotalScore ?? 0),
                CvSummary = a.CvSummary ?? string.Empty,
                Flags = ReadFlags(a.FlagsJson),
                CandidateGitHubUrl = a.CandidateGitHubUrl,
                ClaimedByRecruiterId = a.ClaimedByRecruiterId,
                ShortlistedByRecruiterId = a.ShortlistedByRecruiterId,
                RecruiterRating = a.RecruiterRating,
                AcademicAverage = GetAcademicAverage(a.LatestEvaluation?.InstitutionJson, a.LatestEvaluation?.CategoryScoresJson),
                CreatedAt = a.CreatedAt.UtcDateTime
            })
            .ToList();
    }

    public async Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
    {
        var statusCounts = await _dbContext.ApplicationRecords
            .AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var counts = statusCounts.ToDictionary(a => a.Status, a => a.Count);

        return new DashboardMetricsDto
        {
            TotalApplications = statusCounts.Sum(a => a.Count),
            PendingApplications = counts.GetValueOrDefault(ApplicationStatus.PENDING.ToString()),
            ProcessingApplications = counts.GetValueOrDefault(ApplicationStatus.PROCESSING.ToString()),
            ValidApplications = counts.GetValueOrDefault(ApplicationStatus.VALID.ToString()),
            InvalidApplications = counts.GetValueOrDefault(ApplicationStatus.INVALID.ToString()),
            ManualReviewApplications = counts.GetValueOrDefault(ApplicationStatus.MANUAL_REVIEW.ToString()),
            ShortlistedApplications = counts.GetValueOrDefault(ApplicationStatus.SHORTLISTED.ToString()),
            ErrorApplications = counts.GetValueOrDefault(ApplicationStatus.ERROR.ToString())
        };
    }

    private static double? GetAcademicAverage(JsonDocument? instJson, JsonDocument? scoreJson)
    {
        if (instJson != null)
        {
            try
            {
                var root = instJson.RootElement;
                if (root.TryGetProperty("academic_average", out var avgProp) && avgProp.TryGetDouble(out var val))
                {
                    return val;
                }
                if (root.TryGetProperty("academicAverage", out var avgPropCamel) && avgPropCamel.TryGetDouble(out var valCamel))
                {
                    return valCamel;
                }
            }
            catch { }
        }

        if (scoreJson != null)
        {
            try
            {
                var root = scoreJson.RootElement;
                if (root.TryGetProperty("education", out var eduProp) && 
                    eduProp.TryGetProperty("score", out var scoreProp) && 
                    scoreProp.TryGetDouble(out var val))
                {
                    return val;
                }
            }
            catch { }
        }

        return null;
    }

    private static List<string> ReadFlags(JsonDocument? flagsJson)
    {
        if (flagsJson is null || flagsJson.RootElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return flagsJson.RootElement
            .EnumerateArray()
            .Where(flag => flag.ValueKind == JsonValueKind.String)
            .Select(flag => flag.GetString()!)
            .ToList();
    }
}
