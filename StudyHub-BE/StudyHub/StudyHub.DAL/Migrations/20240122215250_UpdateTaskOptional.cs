using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyHub.DAL.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTaskOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskOptions_TaskVariants_TaskVariantChoiceOptionId",
                table: "TaskOptions");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskOptions_TaskVariants_TaskVariantOpenEndedId",
                table: "TaskOptions");

            migrationBuilder.DropIndex(
                name: "IX_TaskOptions_TaskVariantChoiceOptionId",
                table: "TaskOptions");

            migrationBuilder.DropColumn(
                name: "TaskVariantChoiceOptionId",
                table: "TaskOptions");

            migrationBuilder.RenameColumn(
                name: "TaskVariantOpenEndedId",
                table: "TaskOptions",
                newName: "TaskVariantId");

            migrationBuilder.RenameIndex(
                name: "IX_TaskOptions_TaskVariantOpenEndedId",
                table: "TaskOptions",
                newName: "IX_TaskOptions_TaskVariantId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskOptions_TaskVariants_TaskVariantId",
                table: "TaskOptions",
                column: "TaskVariantId",
                principalTable: "TaskVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskOptions_TaskVariants_TaskVariantId",
                table: "TaskOptions");

            migrationBuilder.RenameColumn(
                name: "TaskVariantId",
                table: "TaskOptions",
                newName: "TaskVariantOpenEndedId");

            migrationBuilder.RenameIndex(
                name: "IX_TaskOptions_TaskVariantId",
                table: "TaskOptions",
                newName: "IX_TaskOptions_TaskVariantOpenEndedId");

            migrationBuilder.AddColumn<Guid>(
                name: "TaskVariantChoiceOptionId",
                table: "TaskOptions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_TaskOptions_TaskVariantChoiceOptionId",
                table: "TaskOptions",
                column: "TaskVariantChoiceOptionId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskOptions_TaskVariants_TaskVariantChoiceOptionId",
                table: "TaskOptions",
                column: "TaskVariantChoiceOptionId",
                principalTable: "TaskVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskOptions_TaskVariants_TaskVariantOpenEndedId",
                table: "TaskOptions",
                column: "TaskVariantOpenEndedId",
                principalTable: "TaskVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
