using System;

namespace Application.DTOs;

public class ApplicationTechnicalRatingDto
{
    public Guid ApplicationId { get; set; }
    public short? TechnicalRating { get; set; }
    public short? RecruiterRating { get; set; }
    public string? RecruiterRatingNote { get; set; }
    public string? RatedByRecruiterId { get; set; }
    public DateTimeOffset? RatedAt { get; set; }
}
