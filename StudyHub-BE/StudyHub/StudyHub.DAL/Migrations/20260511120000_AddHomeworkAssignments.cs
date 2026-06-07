using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyHub.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddHomeworkAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "Assignments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Instructions",
                table: "Assignments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LectureId",
                table: "Assignments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AssignmentAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MimeType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    AssignmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssignmentAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssignmentAttachments_Assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_LectureId",
                table: "Assignments",
                column: "LectureId");

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentAttachments_AssignmentId",
                table: "AssignmentAttachments",
                column: "AssignmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Lectures_LectureId",
                table: "Assignments",
                column: "LectureId",
                principalTable: "Lectures",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Lectures_LectureId",
                table: "Assignments");

            migrationBuilder.DropTable(
                name: "AssignmentAttachments");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_LectureId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "Instructions",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "LectureId",
                table: "Assignments");
        }
    }
}
