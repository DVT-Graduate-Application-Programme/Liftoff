using Domain.Entities;

namespace Application.Queries.GetDashboardApplications;

public static class DashboardSampleData
{
    public static List<DashboardApplicationDto> GetApplications() =>
    [
        new()
        {
            ApplicationId = "b7f1d2c4-8f3a-4d2b-9f1a-2c3d4e5f6789",
            CandidateName = "Thabo Mokoena",
            CurrentStatus = ApplicationStatus.Pending,
            Tier = "STRONG",
            HardGatePassed = true,
            HiringAgentTotalScore = 64,
            CvSummary = "Strong technical candidate with consistent academic performance and an active GitHub history.",
            Flags = [],
            CandidateGitHubUrl = "https://github.com/thabo-mokoena",
            ClaimedByRecruiterId = "recruiter1@company.com",
            ShortlistedByRecruiterId = null,
            RecruiterRating = 4,
            CreatedAt = new DateTime(2025, 1, 15, 10, 30, 0, DateTimeKind.Utc)
        },
        new()
        {
            ApplicationId = "a1b2c3d4-1234-5678-abcd-ef0123456789",
            CandidateName = "Lerato Dlamini",
            CurrentStatus = ApplicationStatus.Shortlisted,
            Tier = "STRONG",
            HardGatePassed = true,
            HiringAgentTotalScore = 71,
            CvSummary = "Exceptional candidate with open-source contributions and internship experience at a fintech company.",
            Flags = [],
            CandidateGitHubUrl = "https://github.com/lerato-dlamini",
            ClaimedByRecruiterId = "recruiter2@company.com",
            ShortlistedByRecruiterId = "recruiter2@company.com",
            RecruiterRating = 5,
            CreatedAt = new DateTime(2025, 1, 14, 9, 0, 0, DateTimeKind.Utc)
        },
        new()
        {
            ApplicationId = "c9d8e7f6-9876-5432-dcba-fedcba987654",
            CandidateName = "Sipho Ndlovu",
            CurrentStatus = ApplicationStatus.Pending,
            Tier = "BORDERLINE",
            HardGatePassed = true,
            HiringAgentTotalScore = 41,
            CvSummary = "Decent academic record but limited practical experience. Some self-projects present.",
            Flags = ["No GitHub found"],
            CandidateGitHubUrl = null,
            ClaimedByRecruiterId = null,
            ShortlistedByRecruiterId = null,
            RecruiterRating = null,
            CreatedAt = new DateTime(2025, 1, 15, 14, 0, 0, DateTimeKind.Utc)
        },
        new()
        {
            ApplicationId = "f1e2d3c4-aaaa-bbbb-cccc-111122223333",
            CandidateName = "Ayanda Khumalo",
            CurrentStatus = ApplicationStatus.Pending,
            Tier = "BORDERLINE",
            HardGatePassed = true,
            HiringAgentTotalScore = 38,
            CvSummary = "Candidate shows potential in niche areas but CV lacks depth in core technical skills.",
            Flags = ["Manual review required"],
            CandidateGitHubUrl = "https://github.com/ayanda-khumalo",
            ClaimedByRecruiterId = "recruiter1@company.com",
            ShortlistedByRecruiterId = null,
            RecruiterRating = 2,
            CreatedAt = new DateTime(2025, 1, 13, 11, 15, 0, DateTimeKind.Utc)
        },
        new()
        {
            ApplicationId = "e5f6a7b8-5555-6666-7777-888899990000",
            CandidateName = "Nomsa Vilakazi",
            CurrentStatus = ApplicationStatus.Rejected,
            Tier = "INVALID",
            HardGatePassed = false,
            HiringAgentTotalScore = 0,
            CvSummary = "Application did not meet the minimum screening criteria.",
            Flags = ["Hard gate failed", "No transcript"],
            CandidateGitHubUrl = null,
            ClaimedByRecruiterId = null,
            ShortlistedByRecruiterId = null,
            RecruiterRating = null,
            CreatedAt = new DateTime(2025, 1, 15, 8, 45, 0, DateTimeKind.Utc)
        },
        new()
        {
            ApplicationId = "d4c3b2a1-dddd-eeee-ffff-000011112222",
            CandidateName = "Kagiso Sithole",
            CurrentStatus = ApplicationStatus.Pending,
            Tier = "STRONG",
            HardGatePassed = true,
            HiringAgentTotalScore = 58,
            CvSummary = "Candidate is currently being evaluated by the Hiring Agent.",
            Flags = [],
            CandidateGitHubUrl = "https://github.com/kagiso-sithole",
            ClaimedByRecruiterId = null,
            ShortlistedByRecruiterId = null,
            RecruiterRating = null,
            CreatedAt = new DateTime(2025, 1, 15, 15, 30, 0, DateTimeKind.Utc)
        },
        new()
        {
            ApplicationId = "b3a2c1d0-1111-2222-3333-444455556666",
            CandidateName = "Thandeka Moyo",
            CurrentStatus = ApplicationStatus.Pending,
            Tier = "WEAK",
            HardGatePassed = false,
            HiringAgentTotalScore = 0,
            CvSummary = "Application is pending initial processing.",
            Flags = ["Pending review"],
            CandidateGitHubUrl = null,
            ClaimedByRecruiterId = null,
            ShortlistedByRecruiterId = null,
            RecruiterRating = null,
            CreatedAt = new DateTime(2025, 1, 15, 16, 0, 0, DateTimeKind.Utc)
        }
    ];
}