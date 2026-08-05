using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTechnicalRatingToApplicationRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<short>(
                name: "TechnicalRating",
                table: "ApplicationRecords",
                type: "smallint",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ApplicationRecords_TechnicalRating_check",
                table: "ApplicationRecords",
                sql: "\"TechnicalRating\" BETWEEN 1 AND 5");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ApplicationRecords_TechnicalRating_check",
                table: "ApplicationRecords");

            migrationBuilder.DropColumn(
                name: "TechnicalRating",
                table: "ApplicationRecords");
        }
    }
}
