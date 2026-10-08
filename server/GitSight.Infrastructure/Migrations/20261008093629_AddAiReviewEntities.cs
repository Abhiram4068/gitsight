using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitSight.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiReviewEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiReviewSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PullRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FinalSuggestionsCount = table.Column<int>(type: "int", nullable: false),
                    SecurityIssuesCount = table.Column<int>(type: "int", nullable: false),
                    SyntaxErrorsCount = table.Column<int>(type: "int", nullable: false),
                    BreachesCount = table.Column<int>(type: "int", nullable: false),
                    PerformanceIssuesCount = table.Column<int>(type: "int", nullable: false),
                    CodeSmellsCount = table.Column<int>(type: "int", nullable: false),
                    TestCoverageImpact = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CodeComplexity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OverallConfidenceScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ExecutiveSummary = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiReviewSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiReviewSessions_PullRequests_PullRequestId",
                        column: x => x.PullRequestId,
                        principalTable: "PullRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiReviewIssues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AiReviewSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    StartLine = table.Column<int>(type: "int", nullable: false),
                    EndLine = table.Column<int>(type: "int", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IssueType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SuggestedRemovedCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SuggestedAddedCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiReviewIssues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiReviewIssues_AiReviewSessions_AiReviewSessionId",
                        column: x => x.AiReviewSessionId,
                        principalTable: "AiReviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiReviewIssues_AiReviewSessionId",
                table: "AiReviewIssues",
                column: "AiReviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AiReviewSessions_PullRequestId",
                table: "AiReviewSessions",
                column: "PullRequestId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiReviewIssues");

            migrationBuilder.DropTable(
                name: "AiReviewSessions");
        }
    }
}
