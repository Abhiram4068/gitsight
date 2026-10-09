using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitSight.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAiReviewEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AiReviewSessions_PullRequests_PullRequestId",
                table: "AiReviewSessions");

            migrationBuilder.DropIndex(
                name: "IX_AiReviewSessions_PullRequestId",
                table: "AiReviewSessions");

            migrationBuilder.DropColumn(
                name: "PullRequestId",
                table: "AiReviewSessions");

            migrationBuilder.AddColumn<string>(
                name: "Owner",
                table: "AiReviewSessions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "PrNumber",
                table: "AiReviewSessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Repo",
                table: "AiReviewSessions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Owner",
                table: "AiReviewSessions");

            migrationBuilder.DropColumn(
                name: "PrNumber",
                table: "AiReviewSessions");

            migrationBuilder.DropColumn(
                name: "Repo",
                table: "AiReviewSessions");

            migrationBuilder.AddColumn<Guid>(
                name: "PullRequestId",
                table: "AiReviewSessions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_AiReviewSessions_PullRequestId",
                table: "AiReviewSessions",
                column: "PullRequestId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AiReviewSessions_PullRequests_PullRequestId",
                table: "AiReviewSessions",
                column: "PullRequestId",
                principalTable: "PullRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
