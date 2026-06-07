using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyHub.DAL.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentSelectedOptions");

            migrationBuilder.DropTable(
                name: "AssignmentTaskOptionBase");

            migrationBuilder.DropColumn(
                name: "Label",
                table: "AssignmentTasks");

            migrationBuilder.RenameColumn(
                name: "Mark",
                table: "AssignmentTasks",
                newName: "MaxMark");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "Assignments",
                newName: "OpeningDate");

            migrationBuilder.RenameColumn(
                name: "FinishDate",
                table: "Assignments",
                newName: "ClosingDate");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "Duration",
                table: "Assignments",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.CreateTable(
                name: "StartingTimeRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsFinished = table.Column<bool>(type: "bit", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StartingTimeRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StartingTimeRecords_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StartingTimeRecords_Assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskVariants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AssignmentTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskVariants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskVariants_AssignmentTasks_AssignmentTaskId",
                        column: x => x.AssignmentTaskId,
                        principalTable: "AssignmentTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Answer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Mark = table.Column<int>(type: "int", nullable: false),
                    TaskVariantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentAnswers_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentAnswers_TaskVariants_TaskVariantId",
                        column: x => x.TaskVariantId,
                        principalTable: "TaskVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: true),
                    TaskVariantOpenEndedId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaskVariantChoiceOptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskOptions_TaskVariants_TaskVariantChoiceOptionId",
                        column: x => x.TaskVariantChoiceOptionId,
                        principalTable: "TaskVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskOptions_TaskVariants_TaskVariantOpenEndedId",
                        column: x => x.TaskVariantOpenEndedId,
                        principalTable: "TaskVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateTable(
                name: "StudentAnswerTaskOption",
                columns: table => new
                {
                    StudentAnswersId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaskOptionsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAnswerTaskOption", x => new { x.StudentAnswersId, x.TaskOptionsId });
                    table.ForeignKey(
                        name: "FK_StudentAnswerTaskOption_StudentAnswers_StudentAnswersId",
                        column: x => x.StudentAnswersId,
                        principalTable: "StudentAnswers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentAnswerTaskOption_TaskOptions_TaskOptionsId",
                        column: x => x.TaskOptionsId,
                        principalTable: "TaskOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_RefreshTokenId",
                table: "AspNetUsers",
                column: "RefreshTokenId");

            migrationBuilder.CreateIndex(
                name: "IX_StartingTimeRecords_AssignmentId",
                table: "StartingTimeRecords",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_StartingTimeRecords_StudentId",
                table: "StartingTimeRecords",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAnswers_StudentId",
                table: "StudentAnswers",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAnswers_TaskVariantId",
                table: "StudentAnswers",
                column: "TaskVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAnswerTaskOption_TaskOptionsId",
                table: "StudentAnswerTaskOption",
                column: "TaskOptionsId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskOptions_TaskVariantChoiceOptionId",
                table: "TaskOptions",
                column: "TaskVariantChoiceOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskOptions_TaskVariantOpenEndedId",
                table: "TaskOptions",
                column: "TaskVariantOpenEndedId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskVariants_AssignmentTaskId",
                table: "TaskVariants",
                column: "AssignmentTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_RefreshTokens_RefreshTokenId",
                table: "AspNetUsers",
                column: "RefreshTokenId",
                principalTable: "RefreshTokens",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_RefreshTokens_RefreshTokenId",
                table: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "StartingTimeRecords");

            migrationBuilder.DropTable(
                name: "StudentAnswerTaskOption");

            migrationBuilder.DropTable(
                name: "StudentAnswers");

            migrationBuilder.DropTable(
                name: "TaskOptions");

            migrationBuilder.DropTable(
                name: "TaskVariants");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_RefreshTokenId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Duration",
                table: "Assignments");

            migrationBuilder.RenameColumn(
                name: "MaxMark",
                table: "AssignmentTasks",
                newName: "Mark");

            migrationBuilder.RenameColumn(
                name: "OpeningDate",
                table: "Assignments",
                newName: "StartDate");

            migrationBuilder.RenameColumn(
                name: "ClosingDate",
                table: "Assignments",
                newName: "FinishDate");

            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "AssignmentTasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AssignmentTaskOptionBase",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignmentTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Discriminator = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssignmentTaskOptionBase", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssignmentTaskOptionBase_AssignmentTasks_AssignmentTaskId",
                        column: x => x.AssignmentTaskId,
                        principalTable: "AssignmentTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentSelectedOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentSelectedOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentSelectedOptions_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentSelectedOptions_AssignmentTaskOptionBase_OptionId",
                        column: x => x.OptionId,
                        principalTable: "AssignmentTaskOptionBase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentTaskOptionBase_AssignmentTaskId",
                table: "AssignmentTaskOptionBase",
                column: "AssignmentTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentSelectedOptions_OptionId",
                table: "StudentSelectedOptions",
                column: "OptionId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentSelectedOptions_StudentId",
                table: "StudentSelectedOptions",
                column: "StudentId");
        }
    }
}
