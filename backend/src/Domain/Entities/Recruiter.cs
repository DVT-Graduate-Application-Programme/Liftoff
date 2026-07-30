using System;

namespace Domain.Entities;

/// <summary>
/// Represents a recruiter who can be assigned to review graduate applications.
/// Maps to the public."Recruiters" table.
/// </summary>
public class Recruiter
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Identity provider identifier (e.g. Azure AD / Entra ID object ID).</summary>
    public string IdentityId { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    /// <summary>Only active recruiters participate in round-robin assignment.</summary>
    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public string FullName => $"{FirstName} {LastName}";
}
