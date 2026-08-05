using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Services;

public class ApplicationOwnershipService : IApplicationOwnershipService
{
    private readonly GradRecruitmentDbContext _dbContext;
    private readonly IApplicationEventService _events;

    public ApplicationOwnershipService(
        GradRecruitmentDbContext dbContext,
        IApplicationEventService events)
    {
        _dbContext = dbContext;
        _events = events;
    }

    public async Task<ApplicationOwnershipClaim?> ClaimOwnershipAsync(
        Guid id,
        string recruiterIdentity,
        CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (applicationRecord is null)
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        applicationRecord.ClaimOwnership(recruiterIdentity, now);
        _dbContext.ApplicationRecords.Update(applicationRecord);

        _events.PublishOwnershipChanged(id, "CLAIM");

        return new ApplicationOwnershipClaim
        {
            ClaimedByRecruiterId = recruiterIdentity,
            ClaimedAt = applicationRecord.ClaimedAt ?? now
        };
    }

    public async Task<ApplicationOwnershipShortlist?> ShortlistAsync(
        Guid id,
        string recruiterIdentity,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (applicationRecord is null)
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        applicationRecord.Shortlist(recruiterIdentity, reason, now);
        _dbContext.ApplicationRecords.Update(applicationRecord);

        _events.PublishOwnershipChanged(id, ApplicationStatus.SHORTLISTED.ToString());

        return new ApplicationOwnershipShortlist
        {
            ShortlistedByRecruiterId = recruiterIdentity,
            ShortlistedAt = applicationRecord.ShortlistedAt ?? now,
            UpdatedStatus = applicationRecord.Status
        };
    }

    public async Task<ApplicationStatusUpdate?> AcceptAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        return await UpdateStatusAsync(id, recruiterIdentity, ApplicationStatus.ACCEPTED.ToString(), reason, cancellationToken);
    }

    public async Task<ApplicationStatusUpdate?> RejectAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        return await UpdateStatusAsync(id, recruiterIdentity, ApplicationStatus.REJECTED.ToString(), reason, cancellationToken);
    }

    private async Task<ApplicationStatusUpdate?> UpdateStatusAsync(Guid id, string recruiterIdentity, string newStatus, string? reason, CancellationToken cancellationToken)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;
        applicationRecord.UpdateStatus(recruiterIdentity, newStatus, reason, now);
        _dbContext.ApplicationRecords.Update(applicationRecord);

        _events.PublishOwnershipChanged(id, newStatus);

        return new ApplicationStatusUpdate
        {
            ActionedByRecruiterId = recruiterIdentity,
            ActionedAt = now,
            UpdatedStatus = newStatus
        };
    }

    public async Task<ApplicationRatingUpdate?> RateAsync(Guid id, string recruiterIdentity, short rating, string? notes, CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;
        applicationRecord.Rate(rating, notes, recruiterIdentity, now);
        _dbContext.ApplicationRecords.Update(applicationRecord);

        _events.PublishOwnershipChanged(id, "RATING");

        return new ApplicationRatingUpdate
        {
            RatedByRecruiterId = recruiterIdentity,
            RatedAt = applicationRecord.RatedAt ?? now,
            RecruiterRating = applicationRecord.RecruiterRating,
            RecruiterRatingNote = applicationRecord.RecruiterRatingNote
        };
    }

    public async Task<ApplicationTechnicalRatingDto?> RateTechnicalAsync(Guid id, string recruiterIdentity, short rating, CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;
        applicationRecord.RateTechnical(rating, recruiterIdentity, now);
        _dbContext.ApplicationRecords.Update(applicationRecord);

        _events.PublishOwnershipChanged(id, "TECHNICAL_RATING");

        return new ApplicationTechnicalRatingDto
        {
            ApplicationId = id,
            TechnicalRating = applicationRecord.TechnicalRating,
            RecruiterRating = applicationRecord.RecruiterRating,
            RecruiterRatingNote = applicationRecord.RecruiterRatingNote,
            RatedByRecruiterId = recruiterIdentity,
            RatedAt = applicationRecord.RatedAt ?? now
        };
    }

    public async Task<ApplicationRatingUpdate?> AddNotesAsync(Guid id, string recruiterIdentity, string notes, CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;
        applicationRecord.AddNote(notes, recruiterIdentity, now);
        _dbContext.ApplicationRecords.Update(applicationRecord);

        _events.PublishOwnershipChanged(id, "NOTES");

        return new ApplicationRatingUpdate
        {
            RatedByRecruiterId = applicationRecord.RatedByRecruiterId ?? string.Empty,
            RatedAt = applicationRecord.RatedAt ?? now,
            RecruiterRating = applicationRecord.RecruiterRating,
            RecruiterRatingNote = applicationRecord.RecruiterRatingNote
        };
    }
}
