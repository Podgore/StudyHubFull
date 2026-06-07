using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyHub.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddOpenEndedTeacherReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "OpenEndedTeacherReviewed",
                table: "StudentAnswers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OpenEndedTeacherFeedback",
                table: "StudentAnswers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OpenEndedTeacherReviewed",
                table: "StudentAnswers");

            migrationBuilder.DropColumn(
                name: "OpenEndedTeacherFeedback",
                table: "StudentAnswers");
        }
    }
}
