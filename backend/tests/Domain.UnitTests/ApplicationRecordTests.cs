using Domain.Entities;
using Domain.Enums;
using FluentAssertions;

namespace Domain.UnitTests;

public class ApplicationRecordTests
{
    [Fact]
    public void Create_InitializesPendingApplicationWithCandidateDetails()
    {
        var now = DateTimeOffset.Parse("2026-07-29T08:30:00Z");

        var record = ApplicationRecord.Create(
            "message-123",
            "candidate@example.com",
            "Candidate One",
            "https://github.com/candidate",
            timestamp: now);

        record.Id.Should().NotBeEmpty();
        record.EmailMessageId.Should().Be("message-123");
        record.CandidateEmail.Should().Be("candidate@example.com");
        record.CandidateName.Should().Be("Candidate One");
        record.CandidateGitHubUrl.Should().Be("https://github.com/candidate");
        record.Status.Should().Be(ApplicationStatus.PENDING.ToString());
        record.CreatedAt.Should().Be(now);
        record.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void ClaimOwnership_UpdatesStateAndRecordsActionAndAuditLog()
    {
        var record = ApplicationRecord.Create("message-124", "candidate@example.com");
        var now = DateTimeOffset.Parse("2026-07-29T09:00:00Z");

        record.ClaimOwnership("recruiter-1", now);

        record.ClaimedByRecruiterId.Should().Be("recruiter-1");
        record.ClaimedAt.Should().Be(now);
        record.UpdatedAt.Should().Be(now);
        record.RecruiterActions.Should().ContainSingle(action =>
            action.RecruiterIdentity == "recruiter-1"
            && action.ActionType == "CLAIM"
            && action.ActionedAt == now);
        record.AuditLogs.Should().ContainSingle(log =>
            log.SourceService == "ApplicationRecordDomain"
            && log.Message.Contains("Ownership claimed"));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void ClaimOwnership_RejectsMissingRecruiterIdentity(string recruiterId)
    {
        var record = ApplicationRecord.Create("message-125", "candidate@example.com");

        var act = () => record.ClaimOwnership(recruiterId);

        act.Should().Throw<ArgumentException>()
            .WithParameterName("recruiterId");
    }

    [Fact]
    public void Shortlist_ChangesStatusAndKeepsPreviousStatusOnAction()
    {
        var record = ApplicationRecord.Create("message-126", "candidate@example.com");
        var now = DateTimeOffset.Parse("2026-07-29T09:30:00Z");

        record.Shortlist("recruiter-2", "Strong project work", now);

        record.Status.Should().Be(ApplicationStatus.SHORTLISTED.ToString());
        record.ShortlistedByRecruiterId.Should().Be("recruiter-2");
        record.ShortlistedAt.Should().Be(now);
        record.RecruiterActions.Should().ContainSingle(action =>
            action.ActionType == "SHORTLIST"
            && action.PreviousStatus == ApplicationStatus.PENDING.ToString()
            && action.NewStatus == ApplicationStatus.SHORTLISTED.ToString()
            && action.Reason == "Strong project work");
    }

    [Fact]
    public void Reject_ClearsExistingShortlistFields()
    {
        var record = ApplicationRecord.Create("message-127", "candidate@example.com");
        record.Shortlist("recruiter-1", timestamp: DateTimeOffset.Parse("2026-07-29T10:00:00Z"));

        record.Reject("recruiter-2", "Role mismatch", DateTimeOffset.Parse("2026-07-29T10:30:00Z"));

        record.Status.Should().Be(ApplicationStatus.REJECTED.ToString());
        record.ShortlistedByRecruiterId.Should().BeNull();
        record.ShortlistedAt.Should().BeNull();
        record.RecruiterActions.Should().Contain(action =>
            action.ActionType == "STATUS_OVERRIDE"
            && action.NewStatus == ApplicationStatus.REJECTED.ToString());
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    public void Rate_AcceptsRatingsWithinBounds(short rating)
    {
        var record = ApplicationRecord.Create("message-128", "candidate@example.com");
        var now = DateTimeOffset.Parse("2026-07-29T11:00:00Z");

        record.Rate(rating, "Interview note", "recruiter-3", now);

        record.RecruiterRating.Should().Be(rating);
        record.RecruiterRatingNote.Should().Be("Interview note");
        record.RatedByRecruiterId.Should().Be("recruiter-3");
        record.RatedAt.Should().Be(now);
        record.RecruiterActions.Should().ContainSingle(action =>
            action.ActionType == "RATING"
            && action.RatingValue == rating
            && action.Reason == "Interview note");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void Rate_RejectsRatingsOutsideBounds(short rating)
    {
        var record = ApplicationRecord.Create("message-129", "candidate@example.com");

        var act = () => record.Rate(rating, "Invalid", "recruiter-3");

        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("rating");
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    public void RateTechnical_AcceptsRatingsWithinBounds(short rating)
    {
        var record = ApplicationRecord.Create("message-130", "candidate@example.com");
        var now = DateTimeOffset.Parse("2026-08-05T11:00:00Z");

        record.RateTechnical(rating, "recruiter-tech-1", now);

        record.TechnicalRating.Should().Be(rating);
        record.RatedByRecruiterId.Should().Be("recruiter-tech-1");
        record.RatedAt.Should().Be(now);
        record.RecruiterActions.Should().ContainSingle(action =>
            action.ActionType == "TECHNICAL_RATING"
            && action.RatingValue == rating);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void RateTechnical_RejectsRatingsOutsideBounds(short rating)
    {
        var record = ApplicationRecord.Create("message-131", "candidate@example.com");

        var act = () => record.RateTechnical(rating, "recruiter-tech-1");

        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("rating");
    }

    [Fact]
    public void ApplyEvaluation_StoresDerivedEvaluationSummary()
    {
        var record = ApplicationRecord.Create("message-130", "candidate@example.com");
        var now = DateTimeOffset.Parse("2026-07-29T12:00:00Z");

        record.ApplyEvaluation(
            status: "EVALUATED",
            tier: "STRONG",
            hardGatePassed: true,
            hardGateReason: "Academic requirement met.",
            totalScore: 88.5m,
            cvSummary: "Solid profile",
            flagsJson: null,
            timestamp: now);

        record.Status.Should().Be("EVALUATED");
        record.Tier.Should().Be("STRONG");
        record.HardGatePassed.Should().BeTrue();
        record.HardGateReason.Should().Be("Academic requirement met.");
        record.HiringAgentTotalScore.Should().Be(88.5m);
        record.CvSummary.Should().Be("Solid profile");
        record.UpdatedAt.Should().Be(now);
        record.AuditLogs.Should().ContainSingle(log =>
            log.SourceService == "HiringAgentEvaluation"
            && log.Message.Contains("Evaluation applied")
            && log.Message.Contains("Tier=STRONG")
            && log.Message.Contains("Status=EVALUATED"));
    }

    [Fact]
    public void ResetEvaluation_ClearsEvaluationFieldsAndExistingEvaluationRows()
    {
        var record = ApplicationRecord.Create("message-131", "candidate@example.com");
        record.HiringAgentEvaluations.Add(new HiringAgentEvaluation { Id = Guid.NewGuid() });
        record.ApplyEvaluation("EVALUATED", "STRONG", true, "Met", 90m, "Summary", null);
        var now = DateTimeOffset.Parse("2026-07-29T13:00:00Z");

        record.ResetEvaluation(now);

        record.Status.Should().Be(ApplicationStatus.PROCESSING.ToString());
        record.Tier.Should().BeNull();
        record.HardGatePassed.Should().BeNull();
        record.HardGateReason.Should().BeNull();
        record.HiringAgentTotalScore.Should().BeNull();
        record.CvSummary.Should().BeNull();
        record.HiringAgentEvaluations.Should().BeEmpty();
        record.UpdatedAt.Should().Be(now);
    }
}
