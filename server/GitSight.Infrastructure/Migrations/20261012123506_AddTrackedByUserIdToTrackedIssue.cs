using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitSight.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackedByUserIdToTrackedIssue : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove existing tracked issues — they were created before user scoping was introduced
            // and have no valid TrackedByUserId to reference.
            migrationBuilder.Sql("DELETE FROM [TrackedIssues]");

            migrationBuilder.AddColumn<Guid>(
                name: "TrackedByUserId",
                table: "TrackedIssues",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_TrackedIssues_TrackedByUserId",
                table: "TrackedIssues",
                column: "TrackedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TrackedIssues_Users_TrackedByUserId",
                table: "TrackedIssues",
                column: "TrackedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TrackedIssues_Users_TrackedByUserId",
                table: "TrackedIssues");

            migrationBuilder.DropIndex(
                name: "IX_TrackedIssues_TrackedByUserId",
                table: "TrackedIssues");

            migrationBuilder.DropColumn(
                name: "TrackedByUserId",
                table: "TrackedIssues");
        }
    }
}
