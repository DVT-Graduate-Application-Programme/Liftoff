USE [master];
GO

-- 1. Create the database safely if it doesn't exist yet
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'GradRecruitmentDb')
BEGIN
    CREATE DATABASE [GradRecruitmentDb];
END
GO

-- 2. Switch context to the app database
USE [GradRecruitmentDb];
GO

-- 3. Drop tables in reverse order of foreign keys if they already exist
-- We use dynamic SQL here to prevent compile-time crashes on a clean machine!
IF DB_ID('GradRecruitmentDb') IS NOT NULL
BEGIN
    EXEC('
        IF OBJECT_ID(''dbo.AuditLogs'', ''U'') IS NOT NULL DROP TABLE [dbo].[AuditLogs];
        IF OBJECT_ID(''dbo.RecruiterActions'', ''U'') IS NOT NULL DROP TABLE [dbo].[RecruiterActions];
        IF OBJECT_ID(''dbo.HiringAgentEvaluations'', ''U'') IS NOT NULL DROP TABLE [dbo].[HiringAgentEvaluations];
        IF OBJECT_ID(''dbo.ApplicationRecords'', ''U'') IS NOT NULL DROP TABLE [dbo].[ApplicationRecords];
    ');
END
GO

-- ==========================================
-- 1. APPLICATION RECORDS TABLE
-- ==========================================
CREATE TABLE [dbo].[ApplicationRecords] (
    [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [EmailMessageId] NVARCHAR(255) NOT NULL,       -- Idempotency key from Power Automate / Graph API
    [CandidateName] NVARCHAR(255) NULL,
    [CandidateEmail] NVARCHAR(255) NULL,
    [CvBlobUrl] NVARCHAR(2048) NULL,            -- Azure Blob Storage SAS link to CV PDF (Subject to change)
    [TranscriptBlobUrl] NVARCHAR(2048) NULL,    -- Azure Blob Storage SAS link to Transcript PDF (Subject to change)
    [Status] NVARCHAR(50) NOT NULL,              -- PENDING, PROCESSING, VALID, INVALID, MANUAL_REVIEW, ERROR
    
    -- Hard Gate (Deterministic Check) Output
    [HardGatePassed] BIT NULL,
    [HardGateReason] NVARCHAR(504) NULL,
    
    -- InterviewStreet Hiring Agent Core Metrics
    [HiringAgentTotalScore] DECIMAL(5,2) NULL,    -- Overall score computed by the agent
    [HiringAgentExplanation] NVARCHAR(MAX) NULL, 
    [CandidateGitHubUrl] NVARCHAR(2048) NULL,     -- Extracted or cross-referenced profile link
    
    -- Recruiter Soft-Claim Data
    [ClaimedByRecruiterId] NVARCHAR(255) NULL,   -- Identity of recruiter who claimed card
    [ClaimedAt] DATETIMEOFFSET NULL,
    
    -- System Timestamps
    [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    [UpdatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    
    CONSTRAINT [PK_ApplicationRecords] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UQ_EmailMessageId] UNIQUE ([EmailMessageId])
);
GO

-- ==========================================
-- 2. HIRING AGENT EVALUATIONS TABLE
-- ==========================================
CREATE TABLE [dbo].[HiringAgentEvaluations] (
    [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [ApplicationRecordId] UNIQUEIDENTIFIER NOT NULL,
    
    -- Structured Metric Breakdowns (Stored as JSON objects for dashboard parsing)
    [CategoryScoresJson] NVARCHAR(MAX) NULL,      -- Scores assigned to skills/experience brackets
    [EvidenceJson] NVARCHAR(MAX) NULL,            -- Extracted programmatic/textual facts backing up scores
    [BonusPointsJson] NVARCHAR(MAX) NULL,         -- Additional points awarded (e.g., exceptional open-source work)
    [DeductionsJson] NVARCHAR(MAX) NULL,          -- Automated penalty flags (e.g., keyword stuffing, layout issues)
    
    -- GitHub Profile Deep Enrichment Signals
    [GitHubProfileDataJson] NVARCHAR(MAX) NULL,   -- Key user metrics (Commits, repo counts, activity graph summary)
    [ProjectClassificationsJson] NVARCHAR(MAX) NULL, -- Agent categorization of repos (Shallow forks vs active production)
    
    [ProcessedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    
    CONSTRAINT [PK_HiringAgentEvaluations] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_HiringAgentEvaluations_ApplicationRecords] FOREIGN KEY ([ApplicationRecordId]) 
        REFERENCES [dbo].[ApplicationRecords] ([Id]) ON DELETE CASCADE
);
GO

-- ==========================================
-- 3. RECRUITER ACTIONS TABLE
-- ==========================================
CREATE TABLE [dbo].[RecruiterActions] (
    [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [ApplicationRecordId] UNIQUEIDENTIFIER NOT NULL,
    [RecruiterIdentity] NVARCHAR(255) NOT NULL,    -- Identity/Email resolved via Microsoft Entra ID
    [ActionType] NVARCHAR(50) NOT NULL,            -- CLAIM, STATUS_OVERRIDE, EMAIL_FORWARD
    [PreviousStatus] NVARCHAR(50) NULL,           -- State tracking before an override
    [NewStatus] NVARCHAR(50) NULL,                -- Target state after an override
    [Reason] NVARCHAR(MAX) NULL,                   -- Mandatory string justification for updates
    [ActionedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    
    CONSTRAINT [PK_RecruiterActions] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_RecruiterActions_ApplicationRecords] FOREIGN KEY ([ApplicationRecordId]) 
        REFERENCES [dbo].[ApplicationRecords] ([Id]) ON DELETE CASCADE
);
GO

-- ==========================================
-- 4. AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE [dbo].[AuditLogs] (
    [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [ApplicationRecordId] UNIQUEIDENTIFIER NULL,
    [SourceService] NVARCHAR(100) NOT NULL,         -- IngestAPI, BackgroundWorker, HiringAgentService
    [LogLevel] NVARCHAR(20) NOT NULL,               -- INFO, WARNING, ERROR
    [Message] NVARCHAR(MAX) NOT NULL,
    [ExceptionDetails] NVARCHAR(MAX) NULL,          -- Stack traces for system visibility
    [Timestamp] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_AuditLogs_ApplicationRecords] FOREIGN KEY ([ApplicationRecordId]) 
        REFERENCES [dbo].[ApplicationRecords] ([Id]) ON DELETE SET NULL
);
GO