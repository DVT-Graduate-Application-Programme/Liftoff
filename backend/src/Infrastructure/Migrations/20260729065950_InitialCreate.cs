using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pgcrypto", ",,");

            migrationBuilder.CreateTable(
                name: "ApplicationRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    EmailMessageId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CandidateName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    CandidateEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    CandidateGitHubUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CvAttachmentId = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    TranscriptAttachmentId = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Tier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    HardGatePassed = table.Column<bool>(type: "boolean", nullable: true),
                    HardGateReason = table.Column<string>(type: "character varying(504)", maxLength: 504, nullable: true),
                    HiringAgentTotalScore = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    HiringAgentExplanation = table.Column<string>(type: "text", nullable: true),
                    CvSummary = table.Column<string>(type: "text", nullable: true),
                    FlagsJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    ClaimedByRecruiterId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ClaimedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ShortlistedByRecruiterId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ShortlistedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RecruiterRating = table.Column<short>(type: "smallint", nullable: true),
                    RecruiterRatingNote = table.Column<string>(type: "text", nullable: true),
                    RatedByRecruiterId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    RatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationRecords", x => x.Id);
                    table.CheckConstraint("ApplicationRecords_RecruiterRating_check", "\"RecruiterRating\" BETWEEN 1 AND 5");
                });

            migrationBuilder.CreateTable(
                name: "Recruiters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    IdentityId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recruiters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ApplicationRecordId = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceService = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LogLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    ExceptionDetails = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_ApplicationRecords",
                        column: x => x.ApplicationRecordId,
                        principalTable: "ApplicationRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "HiringAgentEvaluations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ApplicationRecordId = table.Column<Guid>(type: "uuid", nullable: false),
                    InstitutionJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    CategoryScoresJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    EvidenceJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    BonusPointsJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    DeductionsJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    KeyStrengthsJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    AreasForImprovementJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    GitHubProfileDataJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    ProjectClassificationsJson = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    AiSummary = table.Column<string>(type: "text", nullable: true),
                    ProcessedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HiringAgentEvaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HiringAgentEvaluations_ApplicationRecords",
                        column: x => x.ApplicationRecordId,
                        principalTable: "ApplicationRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecruiterActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ApplicationRecordId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecruiterIdentity = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ActionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PreviousStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NewStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    RatingValue = table.Column<short>(type: "smallint", nullable: true),
                    ActionedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecruiterActions", x => x.Id);
                    table.CheckConstraint("RecruiterActions_RatingValue_check", "\"RatingValue\" BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "FK_RecruiterActions_ApplicationRecords",
                        column: x => x.ApplicationRecordId,
                        principalTable: "ApplicationRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UQ_EmailMessageId",
                table: "ApplicationRecords",
                column: "EmailMessageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_ApplicationRecordId",
                table: "AuditLogs",
                column: "ApplicationRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_HiringAgentEvaluations_ApplicationRecordId",
                table: "HiringAgentEvaluations",
                column: "ApplicationRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_RecruiterActions_ApplicationRecordId",
                table: "RecruiterActions",
                column: "ApplicationRecordId");

            migrationBuilder.CreateIndex(
                name: "UQ_Recruiters_Email",
                table: "Recruiters",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Recruiters_IdentityId",
                table: "Recruiters",
                column: "IdentityId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "HiringAgentEvaluations");

            migrationBuilder.DropTable(
                name: "RecruiterActions");

            migrationBuilder.DropTable(
                name: "Recruiters");

            migrationBuilder.DropTable(
                name: "ApplicationRecords");
        }
    }
}
