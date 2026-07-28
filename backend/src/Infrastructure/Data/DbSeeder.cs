using System;
using System.Text.Json;

using Domain.Entities;
using Domain.Enums;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data;

public static class DbSeeder
{
    // Fixed GUIDs so re-runs are idempotent
    private static readonly Guid App1Id = new("a1000000-0000-0000-0000-000000000001");
    private static readonly Guid App2Id = new("a2000000-0000-0000-0000-000000000002");
    private static readonly Guid App3Id = new("a3000000-0000-0000-0000-000000000003");
    private static readonly Guid App4Id = new("a4000000-0000-0000-0000-000000000004");
    private static readonly Guid App5Id = new("a5000000-0000-0000-0000-000000000005");
    private static readonly Guid App6Id = new("a6000000-0000-0000-0000-000000000006");
    private static readonly Guid App7Id = new("a7000000-0000-0000-0000-000000000007");
    private static readonly Guid App8Id = new("a8000000-0000-0000-0000-000000000008");
    private static readonly Guid App9Id = new("a9000000-0000-0000-0000-000000000009");
    private static readonly Guid App10Id = new("b0000000-0000-0000-0000-000000000010");
    private static readonly Guid App11Id = new("b0000000-0000-0000-0000-000000000011");
    private static readonly Guid App12Id = new("b0000000-0000-0000-0000-000000000012");

    // Fixed Recruiter GUIDs — stable across re-seeds
    private static readonly Guid Recruiter1Id = new("c1000000-0000-0000-0000-000000000001");
    private static readonly Guid Recruiter2Id = new("c2000000-0000-0000-0000-000000000002");

    private static readonly Guid Eval1Id = new("e1000000-0000-0000-0000-000000000001");
    private static readonly Guid Eval2Id = new("e2000000-0000-0000-0000-000000000002");
    private static readonly Guid Eval3Id = new("e3000000-0000-0000-0000-000000000003");
    private static readonly Guid Eval4Id = new("e4000000-0000-0000-0000-000000000004");
    private static readonly Guid Eval5Id = new("e5000000-0000-0000-0000-000000000005");
    private static readonly Guid Eval6Id = new("e6000000-0000-0000-0000-000000000006");
    private static readonly Guid Eval7Id = new("e7000000-0000-0000-0000-000000000007");
    private static readonly Guid Eval8Id = new("e8000000-0000-0000-0000-000000000008");
    private static readonly Guid Eval9Id = new("e9000000-0000-0000-0000-000000000009");
    private static readonly Guid Eval10Id = new("f0000000-0000-0000-0000-000000000010");
    private static readonly Guid Eval11Id = new("f0000000-0000-0000-0000-000000000011");
    private static readonly Guid Eval12Id = new("f0000000-0000-0000-0000-000000000012");

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GradRecruitmentDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<GradRecruitmentDbContext>>();

        // Apply any pending migrations
        await db.Database.MigrateAsync();

        logger.LogInformation("[DbSeeder] Truncating existing data to re-seed POC data…");
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"ApplicationRecords\" CASCADE;");

        // Seed recruiters (idempotent — skip if already present)
        logger.LogInformation("[DbSeeder] Seeding recruiters…");
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO public."Recruiters" ("Id", "IdentityId", "FirstName", "LastName", "Email", "IsActive", "CreatedAt", "UpdatedAt")
            VALUES
                ('c1000000-0000-0000-0000-000000000001', 'siegfriedmini@gmail.com', 'Sashen',  'Govindasamy', 'siegfriedmini@gmail.com',  TRUE, NOW(), NOW()),
                ('c2000000-0000-0000-0000-000000000002', 'rose@dvtsoftware.com',     'Rose',   'Allen-Richards',  'rose@dvtsoftware.com',    TRUE, NOW(), NOW()),
                ('c3000000-0000-0000-0000-000000000003', 'phindi@dvtsoftware.com',    'Phindile',  'Gamede',       'phindi@dvtsoftware.com',   TRUE, NOW(), NOW())
            ON CONFLICT ("IdentityId") DO NOTHING;
            """);

        logger.LogInformation("[DbSeeder] Seeding POC data…");

        string recruiterId1 = "siegfriedmini@gmail.com";
        string recruiterId2 = "rose@dvtsoftware.com";
        string recruiterId3 = "phindi@dvtsoftware.com";


        var app1 = new ApplicationRecord
        {
            Id = App1Id,
            EmailMessageId = "seed-msg-001",
            CandidateName = "Sarah Chen",
            CandidateEmail = "sarah.chen@gmail.com",
            CandidateGitHubUrl = "https://github.com/joseph-dev-grad",
            Status = ApplicationStatus.PENDING.ToString(),
            Tier = "Strong",
            HardGatePassed = true,
            HardGateReason = null,
            ClaimedByRecruiterId = recruiterId1,
            HiringAgentTotalScore = 77.0m,
            HiringAgentExplanation = "Strong full-stack and cloud profile with elite internship experience at AWS.",
            CvSummary = "BSc Computer Science (First Class, Imperial College London). SWE Intern at AWS Serverless Team. Built scalable chat architecture using Redis Pub/Sub.",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-10),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-9),
        };

        var eval1 = new HiringAgentEvaluation
        {
            Id = Eval1Id,
            ApplicationRecordId = App1Id,
            AiSummary = "A standout profile with a solid foundation in modern full-stack frameworks and scalable architectures. Demonstrated leadership in academic projects.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score": 23.0, "max": 25 },
                  "open_source":      { "score":  8.0, "max": 10 },
                  "self_projects":    { "score": 15.0, "max": 25 },
                  "production":       { "score": 18.0, "max": 25 },
                  "technical_skills": { "score": 13.0, "max": 15 },
                  "total":            { "score": 77.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BSc Computer Science, Imperial College London, First Class Honours",
                  "open_source":      "GitHub listed on CV but specific contributions not detailed; interests include open-source contribution",
                  "self_projects":    "Real-Time Collaborative Chat Architecture (React, Redis, PostgreSQL), Machine Learning Stock Predictor (LSTM, Pandas)",
                  "production":       "Software Engineering Intern at AWS (Serverless Team) – designed API Gateway microservices, optimized latency",
                  "technical_skills": "Python, JavaScript, TypeScript, Java, C++, React, Node.js, Next.js, AWS, Docker, Git, CI/CD"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "Imperial College London", "degreeName": "BSc Computer Science", "academic_average": 78.3 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Full-stack software development", "React.js", "RESTful API Design", "Agile/Scrum"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["Limited portfolio links", "Lack of specific cloud infrastructure experience beyond Firebase and AWS basics"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-9),
        };

        // ──────────────────────────────────────────────
        // Candidate 2 – Alex Turner (Score 56)
        // ──────────────────────────────────────────────
        var app2 = new ApplicationRecord
        {
            Id = App2Id,
            EmailMessageId = "seed-msg-002",
            CandidateName = "James Wilson",
            CandidateEmail = "james.wilson@outlook.com",
            CandidateGitHubUrl = null,
            Status = ApplicationStatus.PENDING.ToString(),
            Tier = "Weak",
            HardGatePassed = true,
            HardGateReason = null,
            ClaimedByRecruiterId = recruiterId2,
            HiringAgentTotalScore = 56.0m,
            HiringAgentExplanation = "Solid backend and frontend skills with direct agency placement experience.",
            CvSummary = "BSc Software Engineering (2:1, University of Manchester). Placement as Junior Web Developer at PixelCraft Digital Agency. Built Agile Kanban board and University Student Portal.",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-8),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-7),
        };

        var eval2 = new HiringAgentEvaluation
        {
            Id = Eval2Id,
            ApplicationRecordId = App2Id,
            AiSummary = "Profile lacks substantial evidence of practical coding experience beyond basic coursework. Assessment scores were significantly below the required threshold.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score": 20.0, "max": 25 },
                  "open_source":      { "score":  5.0, "max": 10 },
                  "self_projects":    { "score": 18.0, "max": 25 },
                  "production":       { "score":  0.0, "max": 25 },
                  "technical_skills": { "score": 13.0, "max": 15 },
                  "total":            { "score": 56.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BSc Software Engineering, University of Manchester, Upper Second Class Honours (2:1)",
                  "open_source":      "No significant open-source contributions listed.",
                  "self_projects":    "Agile Task Manager Application (Vue.js, Django REST), University Student Portal (PHP, MySQL)",
                  "production":       "Junior Web Developer Placement at PixelCraft Digital Agency – maintained legacy PHP platforms, refactored frontend layouts",
                  "technical_skills": "JavaScript, Python, PHP, Java, HTML5, CSS3, Vue.js, Django, Flask, Bootstrap, MySQL, SQLite"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University of Manchester", "degreeName": "BSc Software Engineering", "academic_average": 66.7 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Python programming", "Database design (MySQL)", "GUI development (Tkinter)"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["Lack of practical experience", "No open-source contributions"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-7),
        };

        // ──────────────────────────────────────────────
        // Candidate 3 – Elena Rodriguez (Score 73 + 2 bonus = 75)
        // ──────────────────────────────────────────────
        var app3 = new ApplicationRecord
        {
            Id = App3Id,
            EmailMessageId = "seed-msg-003",
            CandidateName = "Elena Rodriguez",
            CandidateEmail = "elena.rodriguez@ucl.ac.uk",
            CandidateGitHubUrl = "https://github.com/josephexample-dev",
            Status = ApplicationStatus.SHORTLISTED.ToString(),
            Tier = "Borderline",
            ClaimedByRecruiterId = recruiterId1,
            HardGatePassed = true,
            HardGateReason = null,
            HiringAgentTotalScore = 75.0m,
            HiringAgentExplanation = "Extremely strong AI/ML profile with elite internship at Google DeepMind and specialized NLP experience.",
            CvSummary = "MSc Artificial Intelligence (Distinction, UCL). Data Scientist Intern at Google DeepMind. Built Biomedical NER model (PyTorch, Hugging Face).",
            ShortlistedByRecruiterId = "Rose@dvtsoftware.com",
            ShortlistedAt = DateTimeOffset.UtcNow.AddDays(-5),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-6),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-5),
        };

        var eval3 = new HiringAgentEvaluation
        {
            Id = Eval3Id,
            ApplicationRecordId = App3Id,
            AiSummary = "Shows promise with front-end technologies, but backend experience is limited. Might need additional ramp-up time compared to top-tier candidates.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score": 23.0, "max": 25 },
                  "open_source":      { "score":  8.0, "max": 10 },
                  "self_projects":    { "score": 14.0, "max": 25 },
                  "production":       { "score": 15.0, "max": 25 },
                  "technical_skills": { "score": 13.0, "max": 15 },
                  "total":            { "score": 73.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "MSc Artificial Intelligence, University College London (UCL), Distinction",
                  "open_source":      "No specific GitHub PRs listed but uses open source heavily (Hugging Face, YOLOv8)",
                  "self_projects":    "Biomedical Named Entity Recognition (PyTorch, Hugging Face), Autonomous Object Tracking & Segmentation",
                  "production":       "Data Scientist Intern at Google DeepMind – evaluated transformer architectures, optimized tokenization pipelines",
                  "technical_skills": "Python, C++, R, PyTorch, TensorFlow, Hugging Face, OpenCV, NumPy, Scikit-Learn, AWS, Docker"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University College London (UCL)", "degreeName": "MSc Artificial Intelligence", "academic_average": 85.0 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 2.0, "breakdown": "Personal Portfolio Website URL: +2" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Strong technical skills", "Demonstrated project experience", "Relevant work experience"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["Limited formal qualifications", "Lack of specific open-source contributions beyond personal projects"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-5),
        };

        // ──────────────────────────────────────────────
        // Candidate 4 – Liam O'Brien (Score 91) – top full-stack, forwarded to hiring manager
        // ──────────────────────────────────────────────
        var app4 = new ApplicationRecord
        {
            Id = App4Id,
            EmailMessageId = "seed-msg-004",
            CandidateName = "Liam O'Brien",
            CandidateEmail = "liam.obrien@ed.ac.uk",
            CandidateGitHubUrl = "https://github.com/liam-obrien-dev",
            ClaimedByRecruiterId = recruiterId3,
            Status = ApplicationStatus.SHORTLISTED.ToString(),
            Tier = "Strong",
            HardGatePassed = true,
            HiringAgentTotalScore = 91.0m,
            HiringAgentExplanation = "Exceptional full-stack candidate. Ships production-grade React + Node.js apps, has two SWE internships, and maintains an open-source React form library with thousands of weekly downloads.",
            CvSummary = "BSc (Hons) Computer Science, University of Edinburgh, First Class. Full-stack intern at Monzo and Sky. Maintains 'react-snap-forms' npm package (8k weekly downloads). Final year project: real-time collaborative whiteboard.",
            ShortlistedByRecruiterId = "Rose@dvtsoftware.com",
            ShortlistedAt = DateTimeOffset.UtcNow.AddDays(-4),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-12),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-4),
        };

        var eval4 = new HiringAgentEvaluation
        {
            Id = Eval4Id,
            ApplicationRecordId = App4Id,
            AiSummary = "Exceptional open-source contributions and deep understanding of cloud infrastructure. A highly competitive candidate with proven production-level skills.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score": 25.0, "max": 25 },
                  "open_source":      { "score": 10.0, "max": 10 },
                  "self_projects":    { "score": 23.0, "max": 25 },
                  "production":       { "score": 21.0, "max": 25 },
                  "technical_skills": { "score": 12.0, "max": 15 },
                  "total":            { "score": 91.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BSc (Hons) Computer Science, University of Edinburgh, First Class; dissertation on WebSocket-based collaborative editing using CRDTs",
                  "open_source":      "GitHub: liam-obrien-dev – 'react-snap-forms' npm library (8k weekly downloads); merged PRs into React Hook Form and shadcn/ui",
                  "self_projects":    "Real-time collaborative whiteboard (React/Yjs/Node.js/WebSockets), e-commerce storefront (Next.js/Stripe/PostgreSQL), personal finance tracker (Vue 3/Express/SQLite)",
                  "production":       "Full-stack SWE Intern at Monzo (React + Go, payment flow UIs) and Sky (Angular + Spring Boot, content delivery portal)",
                  "technical_skills": "TypeScript, React, Next.js, Vue 3, Node.js, Express, Spring Boot, PostgreSQL, MongoDB, Redis, Docker, REST, GraphQL, Jest, Cypress"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University of Edinburgh", "degreeName": "BSc (Hons) Computer Science", "academic_average": 76.0 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 3.0, "breakdown": "Published npm package with verifiable downloads: +3" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["End-to-end full-stack delivery", "Open-source library author", "Two relevant internships", "TypeScript/React/Node.js depth"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["Mobile (native) experience limited", "Infrastructure and cloud deployment is relatively shallow"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-11),
        };

        // ──────────────────────────────────────────────
        // Candidate 5 – Amara Diallo (Score 69) – solid full-stack, evaluated Tier B
        // ──────────────────────────────────────────────
        var app5 = new ApplicationRecord
        {
            Id = App5Id,
            EmailMessageId = "seed-msg-005",
            CandidateName = "Amara Diallo",
            CandidateEmail = "amara.diallo@leeds.ac.uk",
            CandidateGitHubUrl = "https://github.com/amara-fullstack",
            Status = ApplicationStatus.PENDING.ToString(),
            ClaimedByRecruiterId = recruiterId1,
            Tier = "Borderline",
            HardGatePassed = true,
            HiringAgentTotalScore = 69.0m,
            HiringAgentExplanation = "Solid full-stack candidate with a well-rounded Vue/Django skill set and a meaningful 12-month placement year. GitHub is consistent but no external OSS contributions.",
            CvSummary = "BSc Computer Science, University of Leeds, 2:1. 12-month placement at PwC Digital (Vue.js + Django internal tools). Built a full-stack event management app as capstone. Deployed on Railway.",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-9),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-8),
        };

        var eval5 = new HiringAgentEvaluation
        {
            Id = Eval5Id,
            ApplicationRecordId = App5Id,
            AiSummary = "Possesses good foundational knowledge and communication skills, though technical portfolio lacks complexity. Could be a fit with the right mentorship.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score": 21.0, "max": 25 },
                  "open_source":      { "score":  6.0, "max": 10 },
                  "self_projects":    { "score": 18.0, "max": 25 },
                  "production":       { "score": 15.0, "max": 25 },
                  "technical_skills": { "score":  9.0, "max": 15 },
                  "total":            { "score": 69.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BSc Computer Science, University of Leeds, 2:1; modules in web development, software engineering, and relational databases",
                  "open_source":      "GitHub: amara-fullstack – 10 repos, consistent commits over 2 years; capstone project is publicly visible; no external OSS contributions",
                  "self_projects":    "EventHub – full-stack event booking platform (Vue 3 / Django REST Framework / PostgreSQL, deployed on Railway with CI/CD); personal blog CMS (React/Markdown/Node.js)",
                  "production":       "12-month placement at PwC Digital – built internal HR self-service tools using Vue.js frontend and Django REST APIs; participated in two-week sprints with senior engineers",
                  "technical_skills": "JavaScript, Vue 3, React (basic), Python, Django, PostgreSQL, REST APIs, HTML, CSS, Git, GitHub Actions, Docker (introductory)"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University of Leeds", "degreeName": "BSc Computer Science", "academic_average": 66.3 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Vue.js/Django full-stack", "Meaningful placement year", "PostgreSQL database design", "CI/CD and deployment exposure"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["No external open-source contributions", "Limited automated testing experience", "TypeScript not yet adopted"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-8),
        };

        // ──────────────────────────────────────────────
        // Candidate 6 – Chloe Bennett (Score 38) – failed hard gate, rejected
        // ──────────────────────────────────────────────
        var app6 = new ApplicationRecord
        {
            Id = App6Id,
            EmailMessageId = "seed-msg-006",
            CandidateName = "Chloe Bennett",
            CandidateEmail = "chloe.b@live.co.uk",
            CandidateGitHubUrl = null,
            Status = "Rejected",
            ClaimedByRecruiterId = recruiterId3,
            Tier = "Weak",
            HardGatePassed = false,
            HardGateReason = "Degree not in a qualifying IT or STEM discipline. Bootcamp HTML/CSS training is insufficient to compensate for the missing academic requirement.",
            HiringAgentTotalScore = 38.0m,
            HiringAgentExplanation = "Candidate applied via a bootcamp route with a non-STEM degree. Fails the academic hard gate and demonstrated skills are limited to static HTML/CSS — insufficient for a full-stack graduate programme.",
            CvSummary = "BA Media Studies, University of Bedfordshire, 2:2. 3-month online bootcamp (HTML, CSS, basic JS). Part-time barista. No deployed full-stack projects.",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-7),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-6),
        };

        var eval6 = new HiringAgentEvaluation
        {
            Id = Eval6Id,
            ApplicationRecordId = App6Id,
            AiSummary = "Did not pass the initial hard-gate screening due to insufficient graduation credentials and low technical scoring across the board.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score":  8.0, "max": 25 },
                  "open_source":      { "score":  0.0, "max": 10 },
                  "self_projects":    { "score": 10.0, "max": 25 },
                  "production":       { "score": 12.0, "max": 25 },
                  "technical_skills": { "score":  8.0, "max": 15 },
                  "total":            { "score": 38.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BA Media Studies, University of Bedfordshire, 2:2 – does not satisfy the IT/STEM academic requirement for this programme",
                  "open_source":      "No GitHub profile found. No evidence of any open-source or public coding activity.",
                  "self_projects":    "3-month online bootcamp (HTML, CSS, basic JavaScript); static charity landing page listed as key project – no backend, no database, not deployed",
                  "production":       "Part-time barista at Costa Coffee (2 years) – reliable team member, customer service in high-volume environment",
                  "technical_skills": "HTML, CSS, basic JavaScript (DOM manipulation only), Canva, Adobe Premiere (from Media degree)"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University of Bedfordshire", "degreeName": "BA Media Studies", "academic_average": 55.0 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Self-motivated learner", "Creative communication", "Reliable work ethic"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["No qualifying STEM degree", "No backend or database skills", "No deployed full-stack project", "No version control history"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-6),
        };

        // ──────────────────────────────────────────────
        // Candidate 7 – Ravi Nair (Score 80) – strong full-stack, shortlisted Tier A
        // ──────────────────────────────────────────────
        var app7 = new ApplicationRecord
        {
            Id = App7Id,
            EmailMessageId = "seed-msg-007",
            CandidateName = "Ravi Nair",
            CandidateEmail = "ravi.nair@warwick.ac.uk",
            CandidateGitHubUrl = "https://github.com/ravi-builds",
            Status = "Shortlisted",
            ClaimedByRecruiterId = recruiterId2,
            Tier = "Strong",
            HardGatePassed = true,
            HiringAgentTotalScore = 80.0m,
            HiringAgentExplanation = "Strong full-stack profile with React/Spring Boot experience, a 6-month ThoughtWorks internship, and well-tested deployed projects. Comfortable across the entire stack.",
            CvSummary = "BSc (Hons) Software Engineering, University of Warwick, First Class. Full-stack intern at ThoughtWorks. Built a job board platform (React + Spring Boot + PostgreSQL, deployed on Heroku). Active OSS contributor.",
            ShortlistedByRecruiterId = "Rose@dvtsoftware.com",
            ShortlistedAt = DateTimeOffset.UtcNow.AddDays(-3),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-11),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-3),
        };

        var eval7 = new HiringAgentEvaluation
        {
            Id = Eval7Id,
            ApplicationRecordId = App7Id,
            AiSummary = "Outstanding academic record combined with relevant internship experience. Strong problem-solving capabilities evidenced by their algorithmic project work.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score": 24.0, "max": 25 },
                  "open_source":      { "score":  8.0, "max": 10 },
                  "self_projects":    { "score": 21.0, "max": 25 },
                  "production":       { "score": 17.0, "max": 25 },
                  "technical_skills": { "score": 10.0, "max": 15 },
                  "total":            { "score": 80.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BSc (Hons) Software Engineering, University of Warwick, First Class; final year project: full-stack graduate job board with role-based access control and OAuth",
                  "open_source":      "GitHub: ravi-builds – 15 repos; merged PRs into 'react-table' and 'Spring Boot Admin'; 150+ GitHub stars across projects",
                  "self_projects":    "GradBoard – job board (React/TypeScript + Spring Boot + PostgreSQL, Heroku deployment + CI via GitHub Actions); Recipe social app (Next.js + Node.js + MongoDB); CLI REST API scaffolding tool (Java)",
                  "production":       "Full-stack Intern at ThoughtWorks (6 months) – contributed to client e-commerce platform (React + Spring Boot); wrote unit and integration tests using JUnit 5 and React Testing Library",
                  "technical_skills": "Java, Spring Boot, TypeScript, React, Next.js, Node.js, PostgreSQL, MongoDB, REST, JUnit 5, React Testing Library, Git, GitHub Actions, Docker basics, AWS S3"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University of Warwick", "degreeName": "BSc (Hons) Software Engineering", "academic_average": 75.0 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["React/Spring Boot full-stack", "Strong testing culture (JUnit + RTL)", "Deployed real-world projects with CI/CD", "Active open-source contributor"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["Limited cloud/DevOps depth beyond S3", "No mobile experience", "CSS/design skills could be stronger"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-10),
        };

        // ──────────────────────────────────────────────
        // Candidate 8 – Sophie Walsh (Score 54) – below-average full-stack, evaluated Tier C
        // ──────────────────────────────────────────────
        var app8 = new ApplicationRecord
        {
            Id = App8Id,
            EmailMessageId = "seed-msg-008",
            CandidateName = "Sophie Walsh",
            CandidateEmail = "sophie.w@herts.ac.uk",
            CandidateGitHubUrl = "https://github.com/sophiewalsh-dev",
            Status = "Pending",
            Tier = "Weak",
            ClaimedByRecruiterId = recruiterId1,
            HardGatePassed = true,
            HiringAgentTotalScore = 54.0m,
            HiringAgentExplanation = "Some interest in full-stack development but projects are predominantly static front-end. The only backend work is a tutorial-level Express server with no database. No production software experience.",
            CvSummary = "BSc Computer Science, University of Hertfordshire, 2:2. Built a to-do list app (localStorage). Tutorial Node/Express project. No deployment experience. Part-time waitress.",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-5),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-4),
        };

        var eval8 = new HiringAgentEvaluation
        {
            Id = Eval8Id,
            ApplicationRecordId = App8Id,
            AiSummary = "The candidate's technical skills appear very rudimentary. Minimal project history and poor performance in the technical evaluation phase.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score": 16.0, "max": 25 },
                  "open_source":      { "score":  3.0, "max": 10 },
                  "self_projects":    { "score": 12.0, "max": 25 },
                  "production":       { "score": 13.0, "max": 25 },
                  "technical_skills": { "score": 10.0, "max": 15 },
                  "total":            { "score": 54.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BSc Computer Science, University of Hertfordshire, 2:2; modules covered introductory Java, HTML/CSS, and basic networking",
                  "open_source":      "GitHub: sophiewalsh-dev – 5 repos, mostly tutorial follow-along code; last commit 4 months ago; no external contributions",
                  "self_projects":    "To-do list app (vanilla JS + localStorage, no backend or database); Traversy Media Node/Express tutorial uploaded verbatim; no original full-stack project deployed",
                  "production":       "Part-time waitress at Nando's (18 months) – customer-facing role; team collaboration and time management; no software engineering exposure",
                  "technical_skills": "HTML, CSS, vanilla JavaScript, basic Node.js/Express (tutorial level), introductory Java, Git (basic commit/push only)"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University of Hertfordshire", "degreeName": "BSc Computer Science", "academic_average": 57.7 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Foundational HTML/CSS/JS knowledge", "Awareness of Node.js ecosystem", "Strong interpersonal skills from customer-facing work"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["No original full-stack project with a database", "Backend knowledge is tutorial-only", "Infrequent and stale GitHub activity", "No framework experience (React/Vue/Angular)"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-4),
        };

        // ──────────────────────────────────────────────
        // Candidate 9 – Marcus Okafor (Score 44) – very weak full-stack, evaluated Tier C
        // ──────────────────────────────────────────────
        var app9 = new ApplicationRecord
        {
            Id = App9Id,
            EmailMessageId = "seed-msg-009",
            CandidateName = "Marcus Okafor",
            CandidateEmail = "marcus.o@northampton.ac.uk",
            CandidateGitHubUrl = null,
            Status = "Pending",
            ClaimedByRecruiterId = recruiterId2,
            Tier = "Weak",
            HardGatePassed = true,
            HiringAgentTotalScore = 44.0m,
            HiringAgentExplanation = "Meets the minimum academic requirement but cannot demonstrate any meaningful full-stack capability. No GitHub, no deployed project, no relevant work experience in software.",
            CvSummary = "BSc Information Technology, University of Northampton, 2:2. Lists HTML, CSS, and 'some JavaScript' on CV. Static university coursework website. No backend experience declared.",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-4),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-3),
        };

        var eval9 = new HiringAgentEvaluation
        {
            Id = Eval9Id,
            ApplicationRecordId = App9Id,
            AiSummary = "While showing enthusiasm, the candidate currently lacks the necessary practical experience and core competencies required for this role.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score": 15.0, "max": 25 },
                  "open_source":      { "score":  0.0, "max": 10 },
                  "self_projects":    { "score":  8.0, "max": 25 },
                  "production":       { "score": 12.0, "max": 25 },
                  "technical_skills": { "score":  9.0, "max": 15 },
                  "total":            { "score": 44.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BSc Information Technology, University of Northampton, 2:2; coursework included introductory web design and a database management module",
                  "open_source":      "No GitHub profile provided. No verifiable public coding history found.",
                  "self_projects":    "Static HTML/CSS university society website (coursework submission); claims 'some JavaScript' but no interactive or dynamic project demonstrated; no backend, no database, not deployed",
                  "production":       "Call centre agent at HSBC (part-time, 1 year) – inbound customer support; no technical responsibilities",
                  "technical_skills": "HTML, CSS, some JavaScript (self-reported, unverified), Microsoft Office, basic SQL (from DB module); no framework or backend language declared"
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University of Northampton", "degreeName": "BSc Information Technology", "academic_average": 55.3 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Communication and community engagement", "Willingness to self-learn", "Networking fundamentals"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["No meaningful software projects", "No open-source presence", "Python skills at beginner level only"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-3),
        };

        // ──────────────────────────────────────────────
        // Candidate 10 – Tomás Reyes (Chef / Culinary Arts) – hard gate fail, rejected
        // ──────────────────────────────────────────────
        var app10 = new ApplicationRecord
        {
            Id = App10Id,
            EmailMessageId = "seed-msg-010",
            CandidateName = "Tomás Reyes",
            CandidateEmail = "tomas.reyes@culinary.co.uk",
            CandidateGitHubUrl = null,
            ClaimedByRecruiterId = recruiterId3,
            Status = "Rejected",
            Tier = "Weak",
            HardGatePassed = false,
            HardGateReason = "Degree is in Culinary Arts – not an IT, Computer Science, or STEM discipline. No evidence of self-taught programming or compensating technical experience.",
            HiringAgentTotalScore = 12.0m,
            HiringAgentExplanation = "Candidate holds a Level 5 Diploma in Professional Culinary Arts with no academic computing background. Application shows no software projects, no code, no GitHub, and no technical skills relevant to a full-stack development role. This application does not meet the minimum requirements for the programme.",
            CvSummary = "Level 5 Diploma in Professional Culinary Arts, Westminster Kingsway College. Head Chef at The Harbour Inn (3 yrs). Skills: knife skills, menu design, food hygiene. No programming background.",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-14),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-14),
        };

        var eval10 = new HiringAgentEvaluation
        {
            Id = Eval10Id,
            ApplicationRecordId = App10Id,
            AiSummary = "Fails to meet the baseline technical requirements. Limited exposure to our required tech stack and no significant project work demonstrated.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score":  0.0, "max": 25 },
                  "open_source":      { "score":  0.0, "max": 10 },
                  "self_projects":    { "score":  0.0, "max": 25 },
                  "production":       { "score": 12.0, "max": 25 },
                  "technical_skills": { "score":  0.0, "max": 15 },
                  "total":            { "score": 12.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "Level 5 Diploma in Professional Culinary Arts, Westminster Kingsway College – no IT, computing, or STEM qualification whatsoever",
                  "open_source":      "No GitHub profile. No online coding presence found. No technical contributions of any kind identified.",
                  "self_projects":    "No software projects listed or found. CV mentions designing a seasonal tasting menu and leading a kitchen team as project examples.",
                  "production":       "Head Chef at The Harbour Inn (3 years) and Sous Chef at The Ivy Brasserie (2 years) – extensive food industry experience demonstrating leadership and high-pressure delivery, but entirely non-technical",
                  "technical_skills": "No programming languages, frameworks, or developer tools listed. Skills section references mise en place, HACCP compliance, and stock management."
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "Westminster Kingsway College", "degreeName": "Level 5 Diploma in Professional Culinary Arts", "academic_average": 65.0 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Strong leadership under pressure", "High standards of quality and precision", "Exceptional time management in kitchen environments"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["No IT or STEM qualification", "Zero programming knowledge", "No software projects of any kind", "No technical skills applicable to full-stack development"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-14),
        };

        // ──────────────────────────────────────────────
        // Candidate 11 – Harriet Langley (MBA) – hard gate fail, pending
        // ──────────────────────────────────────────────
        var app11 = new ApplicationRecord
        {
            Id = App11Id,
            EmailMessageId = "seed-msg-011",
            CandidateName = "Harriet Langley",
            CandidateEmail = "harriet.langley@lbs.edu",
            CandidateGitHubUrl = null,
            Status = "Rejected",
            Tier = "Weak",
            HardGatePassed = false,
            ClaimedByRecruiterId = recruiterId2,
            HardGateReason = "MBA is a postgraduate business qualification, not an IT or STEM degree. Undergraduate degree is in History. No compensating technical background identified.",
            HiringAgentTotalScore = 8.0m,
            HiringAgentExplanation = "Candidate holds a BA in History and an MBA with a Digital Business elective. Neither qualification meets the academic requirement for this full-stack graduate programme. The 'Digital Business' module does not confer programming skills. No GitHub, no code, no software projects are present on the CV or online. This is a clear hard gate failure with no compensating evidence.",
            CvSummary = "BA History (2:1, University of Exeter). MBA with Digital Business elective, London Business School. Marketing Manager at Deloitte (2 yrs). Strong Excel and PowerPoint. No software development experience.",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-13),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-13),
        };

        var eval11 = new HiringAgentEvaluation
        {
            Id = Eval11Id,
            ApplicationRecordId = App11Id,
            AiSummary = "Profile does not align with our engineering standards. Missing key technical skills and practical application experience.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score":  0.0, "max": 25 },
                  "open_source":      { "score":  0.0, "max": 10 },
                  "self_projects":    { "score":  0.0, "max": 25 },
                  "production":       { "score":  8.0, "max": 25 },
                  "technical_skills": { "score":  0.0, "max": 15 },
                  "total":            { "score":  8.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BA History, University of Exeter (2:1) + MBA with Digital Business elective, London Business School – neither satisfies the IT/STEM academic requirement. 'Digital Business' elective covered digital strategy and market analysis, not software engineering.",
                  "open_source":      "No GitHub profile found. No coding presence on any platform (Stack Overflow, GitLab, etc.) detected.",
                  "self_projects":    "No software projects identified. CV lists a 'Digital Transformation Strategy' report produced during the MBA as a project, which is a business document, not a technical deliverable.",
                  "production":       "Marketing Manager at Deloitte (2 years) – led campaign analytics using Google Ads and HubSpot; no software development responsibilities. Previous role as Graduate Analyst at KPMG (1 year) – financial modelling in Excel.",
                  "technical_skills": "Microsoft Office Suite (advanced Excel, PowerPoint), HubSpot, Google Analytics, Salesforce CRM – no programming language, framework, or developer tooling declared."
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "London Business School", "degreeName": "MBA (Digital Business)", "academic_average": 83.3 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Strong business acumen", "Analytical thinking (financial modelling)", "Digital marketing fluency", "Prestigious academic pedigree"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["No STEM or IT academic qualification", "No programming experience whatsoever", "No software or technical project", "Digital Business MBA elective is not a compensating factor for this programme"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-13),
        };

        // ──────────────────────────────────────────────
        // Candidate 12 – Derek Hobson (BSc Geography + prompt injection attempt)
        // ──────────────────────────────────────────────
        var app12 = new ApplicationRecord
        {
            Id = App12Id,
            EmailMessageId = "seed-msg-012",
            CandidateName = "Derek Hobson",
            CandidateEmail = "derek.hobson@plymouth.ac.uk",
            CandidateGitHubUrl = null,
            ClaimedByRecruiterId = recruiterId3,
            Status = "Rejected",
            Tier = "Weak",
            HardGatePassed = false,
            HardGateReason = "Degree is in Physical Geography – not an IT or STEM computing discipline. Attempted prompt injection detected in CV; application automatically rejected.",
            HiringAgentTotalScore = 5.0m,
            HiringAgentExplanation = "Candidate's Physical Geography degree does not qualify for this programme. Additionally, a prompt injection attempt was detected in the CV text: the candidate inserted hidden instructions attempting to override the scoring rubric and award maximum marks. This is grounds for immediate rejection regardless of other factors.",
            FlagsJson = JsonDocument.Parse("""{ "promptInjection": true, "flaggedAt": "automated-screening" }"""),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-11),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-11),
        };

        var eval12 = new HiringAgentEvaluation
        {
            Id = Eval12Id,
            ApplicationRecordId = App12Id,
            AiSummary = "Candidate did not demonstrate sufficient proficiency in required languages or frameworks. Overall evaluation score is too low to proceed.",
            CategoryScoresJson = JsonDocument.Parse("""
                {
                  "education":        { "score":  0.0, "max": 25 },
                  "open_source":      { "score":  0.0, "max": 10 },
                  "self_projects":    { "score":  5.0, "max": 25 },
                  "production":       { "score":  0.0, "max": 25 },
                  "technical_skills": { "score":  0.0, "max": 15 },
                  "total":            { "score":  5.0, "max": 100 }
                }
                """),
            EvidenceJson = JsonDocument.Parse("""
                {
                  "education":        "BSc Physical Geography, University of Plymouth, 2:2 – entirely non-computing discipline; GIS mapping and environmental data analysis modules do not constitute programming or software engineering",
                  "open_source":      "No GitHub profile. No evidence of any technical online presence.",
                  "self_projects":    "CV mentions a 'website' built for a local hiking club using a drag-and-drop Wix builder – no code written; not a software engineering project.",
                  "production":       "No work experience listed beyond a summer job as a campsite warden.",
                  "technical_skills": "ArcGIS, Microsoft Excel, basic QGIS – no programming language or developer tool listed."
                }
                """),
            InstitutionJson = JsonDocument.Parse("""
                { "name": "University of Plymouth", "degreeName": "BSc Physical Geography", "academic_average": 56.0 }
                """),
            BonusPointsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            DeductionsJson = JsonDocument.Parse("""{ "total": 0.0, "breakdown": "" }"""),
            KeyStrengthsJson = JsonDocument.Parse("""
                ["Spatial data analysis (GIS)", "Environmental research methodology"]
                """),
            AreasForImprovementJson = JsonDocument.Parse("""
                ["Non-qualifying degree (Geography)", "No programming skills", "No legitimate software projects", "Prompt injection attempt – automatic disqualification"]
                """),
            ProcessedAt = DateTimeOffset.UtcNow.AddDays(-11),
        };

        db.ApplicationRecords.AddRange(app1, app2, app3, app4, app5, app6, app7, app8, app9, app10, app11, app12);
        db.HiringAgentEvaluations.AddRange(eval1, eval2, eval3, eval4, eval5, eval6, eval7, eval8, eval9, eval10, eval11, eval12);

        var auditLogs = new List<AuditLog>
        {
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App1Id, SourceService = "IngestionService", LogLevel = "Information", Message = "Transcript ingested and parsed for candidate review.", Timestamp = DateTimeOffset.UtcNow.AddDays(-10) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App1Id, SourceService = "RecruiterPortal", LogLevel = "Information", Message = "Recruiter added a rating and notes for the application.", Timestamp = DateTimeOffset.UtcNow.AddDays(-2) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App3Id, SourceService = "RecruiterPortal", LogLevel = "Information", Message = "Application shortlisted for the next interview stage.", Timestamp = DateTimeOffset.UtcNow.AddDays(-5) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App4Id, SourceService = "RecruiterPortal", LogLevel = "Information", Message = "Recruiter forwarded the candidate to the engineering lead.", Timestamp = DateTimeOffset.UtcNow.AddDays(-4) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App4Id, SourceService = "RecruiterPortal", LogLevel = "Information", Message = "Follow-up note left for the hiring team.", Timestamp = DateTimeOffset.UtcNow.AddDays(-3) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App7Id, SourceService = "RecruiterPortal", LogLevel = "Information", Message = "Recruiter submitted a rating for the shortlisted candidate.", Timestamp = DateTimeOffset.UtcNow.AddDays(-4) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App7Id, SourceService = "RecruiterPortal", LogLevel = "Information", Message = "Application moved to shortlisted status after the initial screen.", Timestamp = DateTimeOffset.UtcNow.AddDays(-2) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App10Id, SourceService = "HiringAgent", LogLevel = "Warning", Message = "Application rejected after hard-gate screening failed.", Timestamp = DateTimeOffset.UtcNow.AddDays(-14) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App12Id, SourceService = "HiringAgent", LogLevel = "Warning", Message = "Application rejected due to prompt injection detection and low technical fit.", Timestamp = DateTimeOffset.UtcNow.AddDays(-11) },
        };

        db.AuditLogs.AddRange(auditLogs);

        var actions = new List<RecruiterAction>
        {
            // App1: Rating and Notes
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App1Id, RecruiterIdentity = "siegfriedmini@gmail.com", ActionType = "RATING", RatingValue = 5, Reason = "Exceptional profile, great potential.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-2) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App1Id, RecruiterIdentity = "Rose@dvtsoftware.com", ActionType = "NOTES", Reason = "Left a voicemail to schedule technical round.", ActionedAt = DateTimeOffset.UtcNow.AddHours(-5) },
            
            // App3: Shortlisted
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App3Id, RecruiterIdentity = "siegfriedmini@gmail.com", ActionType = "SHORTLIST", PreviousStatus = "Pending", NewStatus = "Shortlisted", Reason = "Strong candidate, advancing to interview.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-5) },

            // App4: Shortlisted (was "forwarded" — mapped to Shortlisted)
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App4Id, RecruiterIdentity = "Rose@dvtsoftware.com", ActionType = "SHORTLIST", PreviousStatus = "Pending", NewStatus = "Shortlisted", Reason = "Forwarding to engineering lead for review.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-3) },

            // App6: Rejected
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App6Id, RecruiterIdentity = "Phindi@dvtsoftware.com", ActionType = "REJECT", PreviousStatus = "Pending", NewStatus = "Rejected", Reason = "Lacks required technical skills.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-1) },
            
            // App7: Shortlisted and Rated
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App7Id, RecruiterIdentity = "Phindi@dvtsoftware.com", ActionType = "RATING", RatingValue = 4, Reason = "Good algorithm skills.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-4) },
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App7Id, RecruiterIdentity = "Phindi@dvtsoftware.com", ActionType = "SHORTLIST", PreviousStatus = "Pending", NewStatus = "Shortlisted", Reason = "Passed initial screen.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-2) },
            
            // App10: Rejected
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App10Id, RecruiterIdentity = "Rose@dvtsoftware.com", ActionType = "REJECT", PreviousStatus = "Pending", NewStatus = "Rejected", Reason = "Does not meet baseline experience.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-7) },
            
            // App11: Rejected
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App11Id, RecruiterIdentity = "Rose@dvtsoftware.com", ActionType = "REJECT", PreviousStatus = "Pending", NewStatus = "Rejected", Reason = "Failed automated technical assessment.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-6) },
            
            // App12: Rejected
            new() { Id = Guid.NewGuid(), ApplicationRecordId = App12Id, RecruiterIdentity = "Rose@dvtsoftware.com", ActionType = "REJECT", PreviousStatus = "Pending", NewStatus = "Rejected", Reason = "Poor cultural fit identified in pre-screen.", ActionedAt = DateTimeOffset.UtcNow.AddDays(-5) },
        };

        db.RecruiterActions.AddRange(actions);

        await db.SaveChangesAsync();
        logger.LogInformation("[DbSeeder] Seeded 12 application records, 12 evaluations, 9 audit logs, and mock actions successfully.");
    }
}
