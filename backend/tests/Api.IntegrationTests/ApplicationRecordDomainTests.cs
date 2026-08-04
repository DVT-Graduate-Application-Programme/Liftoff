using System;
using System.Linq;
using Domain.Entities;
using Domain.Enums;
using Xunit;

namespace Api.IntegrationTests;

public class ApplicationRecordDomainTests
{
    [Fact]
    public void ClaimOwnership_UpdatesStateAndLogsAction()
    {
        var record = ApplicationRecord.Create("msg-100", "candidate@example.com");
        var now = DateTimeOffset.UtcNow;

        record.ClaimOwnership("recruiter-1", now);

        Assert.Equal("recruiter-1", record.ClaimedByRecruiterId);
        Assert.Equal(now, record.ClaimedAt);
        Assert.Equal(now, record.UpdatedAt);
        
        var action = Assert.Single(record.RecruiterActions);
        Assert.Equal("recruiter-1", action.RecruiterIdentity);
        Assert.Equal("CLAIM", action.ActionType);
        Assert.Equal(now, action.ActionedAt);

        Assert.NotEmpty(record.AuditLogs);
    }

    [Fact]
    public void ClaimOwnership_ThrowsArgumentException_WhenRecruiterIdIsEmpty()
    {
        var record = ApplicationRecord.Create("msg-101", "candidate@example.com");
        Assert.Throws<ArgumentException>(() => record.ClaimOwnership(""));
    }

    [Fact]
    public void Shortlist_UpdatesStatusAndLogsAction()
    {
        var record = ApplicationRecord.Create("msg-102", "candidate@example.com");
        var now = DateTimeOffset.UtcNow;

        record.Shortlist("recruiter-2", "Top candidate", now);

        Assert.Equal("recruiter-2", record.ShortlistedByRecruiterId);
        Assert.Equal(now, record.ShortlistedAt);
        Assert.Equal(ApplicationStatus.SHORTLISTED.ToString(), record.Status);
        Assert.Equal(now, record.UpdatedAt);

        var action = Assert.Single(record.RecruiterActions);
        Assert.Equal("recruiter-2", action.RecruiterIdentity);
        Assert.Equal("SHORTLIST", action.ActionType);
        Assert.Equal("Top candidate", action.Reason);
        Assert.Equal(ApplicationStatus.SHORTLISTED.ToString(), action.NewStatus);
    }

    [Fact]
    public void Rate_UpdatesRatingAndValidatesBounds()
    {
        var record = ApplicationRecord.Create("msg-103", "candidate@example.com");
        var now = DateTimeOffset.UtcNow;

        record.Rate(4, "Great interview performance", "recruiter-1", now);

        Assert.Equal((short)4, record.RecruiterRating);
        Assert.Equal("Great interview performance", record.RecruiterRatingNote);
        Assert.Equal("recruiter-1", record.RatedByRecruiterId);
        Assert.Equal(now, record.RatedAt);

        Assert.Throws<ArgumentOutOfRangeException>(() => record.Rate(6, "Invalid", "recruiter-1"));
        Assert.Throws<ArgumentOutOfRangeException>(() => record.Rate(0, "Invalid", "recruiter-1"));
    }

    [Fact]
    public void Reject_ClearsShortlistFields()
    {
        var record = ApplicationRecord.Create("msg-104", "candidate@example.com");
        record.Shortlist("recruiter-1");
        Assert.NotNull(record.ShortlistedByRecruiterId);

        record.Reject("recruiter-2", "Not enough experience");

        Assert.Equal(ApplicationStatus.REJECTED.ToString(), record.Status);
        Assert.Null(record.ShortlistedByRecruiterId);
        Assert.Null(record.ShortlistedAt);
    }

    [Fact]
    public void ApplyEvaluationAndReset_WorkCorrectly()
    {
        var record = ApplicationRecord.Create("msg-105", "candidate@example.com");
        
        record.ApplyEvaluation(
            status: "EVALUATED",
            tier: "Strong",
            hardGatePassed: true,
            hardGateReason: "Passed STEM degree",
            totalScore: 88.5m,
            cvSummary: "Solid profile",
            flagsJson: null);

        Assert.Equal("EVALUATED", record.Status);
        Assert.Equal("Strong", record.Tier);
        Assert.True(record.HardGatePassed);
        Assert.Equal(88.5m, record.HiringAgentTotalScore);

        record.ResetEvaluation();

        Assert.Equal(ApplicationStatus.PROCESSING.ToString(), record.Status);
        Assert.Null(record.Tier);
        Assert.Null(record.HardGatePassed);
        Assert.Null(record.HiringAgentTotalScore);
    }
}
