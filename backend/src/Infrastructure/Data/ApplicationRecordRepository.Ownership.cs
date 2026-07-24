using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public partial class ApplicationRecordRepository
{
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
        applicationRecord.ClaimedByRecruiterId = recruiterIdentity;
        applicationRecord.ClaimedAt = now;
        applicationRecord.UpdatedAt = now;

        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "CLAIM",
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, "CLAIM");

        return new ApplicationOwnershipClaim
        {
            ClaimedByRecruiterId = recruiterIdentity,
            ClaimedAt = now
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

        const string shortlistedStatus = "SHORTLISTED";
        var now = DateTimeOffset.UtcNow;
        var previousStatus = applicationRecord.Status;

        applicationRecord.ShortlistedByRecruiterId = recruiterIdentity;
        applicationRecord.ShortlistedAt = now;
        applicationRecord.Status = shortlistedStatus;
        applicationRecord.UpdatedAt = now;

        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "SHORTLIST",
            PreviousStatus = previousStatus,
            NewStatus = shortlistedStatus,
            Reason = reason,
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, "SHORTLIST");

        return new ApplicationOwnershipShortlist
        {
            ShortlistedByRecruiterId = recruiterIdentity,
            ShortlistedAt = now,
            UpdatedStatus = shortlistedStatus
        };
    }

    public async Task<ApplicationStatusUpdate?> AcceptAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        return await UpdateStatusAsync(id, recruiterIdentity, "ACCEPTED", reason, cancellationToken);
    }

    public async Task<ApplicationStatusUpdate?> RejectAsync(Guid id, string recruiterIdentity, string? reason, CancellationToken cancellationToken = default)
    {
        return await UpdateStatusAsync(id, recruiterIdentity, "REJECTED", reason, cancellationToken);
    }

    private async Task<ApplicationStatusUpdate?> UpdateStatusAsync(Guid id, string recruiterIdentity, string newStatus, string? reason, CancellationToken cancellationToken)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;
        var previousStatus = applicationRecord.Status;

        applicationRecord.Status = newStatus;
        applicationRecord.UpdatedAt = now;
        if (newStatus == "REJECTED")
        {
            applicationRecord.ShortlistedByRecruiterId = null;
            applicationRecord.ShortlistedAt = null;
        }
        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "STATUS_OVERRIDE",
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Reason = reason,
            ActionedAt = now
        }, cancellationToken);

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

        applicationRecord.RecruiterRating = rating;
        if (notes is null && applicationRecord.RecruiterRatingNote is not null) {
            // keep old notes
        } else {
            applicationRecord.RecruiterRatingNote = notes;
        }
        applicationRecord.RatedByRecruiterId = recruiterIdentity;
        applicationRecord.RatedAt = now;
        applicationRecord.UpdatedAt = now;

        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "RATING",
            RatingValue = rating,
            Reason = notes,
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, "RATING");

        return new ApplicationRatingUpdate
        {
            RatedByRecruiterId = recruiterIdentity,
            RatedAt = now,
            RecruiterRating = applicationRecord.RecruiterRating,
            RecruiterRatingNote = applicationRecord.RecruiterRatingNote
        };
    }

    public async Task<ApplicationRatingUpdate?> AddNotesAsync(Guid id, string recruiterIdentity, string notes, CancellationToken cancellationToken = default)
    {
        var applicationRecord = await _dbContext.ApplicationRecords.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (applicationRecord is null) return null;

        var now = DateTimeOffset.UtcNow;

        applicationRecord.RecruiterRatingNote = notes;
        applicationRecord.UpdatedAt = now;

        _dbContext.ApplicationRecords.Update(applicationRecord);

        await _dbContext.RecruiterActions.AddAsync(new RecruiterAction
        {
            ApplicationRecordId = id,
            RecruiterIdentity = recruiterIdentity,
            ActionType = "RATING",
            RatingValue = applicationRecord.RecruiterRating,
            Reason = notes,
            ActionedAt = now
        }, cancellationToken);

        _events.PublishOwnershipChanged(id, "NOTES");

        return new ApplicationRatingUpdate
        {
            RatedByRecruiterId = applicationRecord.RatedByRecruiterId ?? string.Empty,
            RatedAt = applicationRecord.RatedAt ?? now,
            RecruiterRating = applicationRecord.RecruiterRating,
            RecruiterRatingNote = notes
        };
    }
}
