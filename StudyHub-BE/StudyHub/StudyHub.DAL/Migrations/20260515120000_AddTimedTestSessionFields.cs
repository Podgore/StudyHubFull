using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyHub.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddTimedTestSessionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SelectedVariantIdsJson",
                table: "StartingTimeRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SessionHash",
                table: "StartingTimeRecords",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SessionToken",
                table: "StartingTimeRecords",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelectedVariantIdsJson",
                table: "StartingTimeRecords");

            migrationBuilder.DropColumn(
                name: "SessionHash",
                table: "StartingTimeRecords");

            migrationBuilder.DropColumn(
                name: "SessionToken",
                table: "StartingTimeRecords");
        }
    }
}
