using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitSight.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiReviewSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Owner = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Repo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PrNumber = table.Column<int>(type: "integer", nullable: false),
                    FinalSuggestionsCount = table.Column<int>(type: "integer", nullable: false),
                    SecurityIssuesCount = table.Column<int>(type: "integer", nullable: false),
                    SyntaxErrorsCount = table.Column<int>(type: "integer", nullable: false),
                    BreachesCount = table.Column<int>(type: "integer", nullable: false),
                    PerformanceIssuesCount = table.Column<int>(type: "integer", nullable: false),
                    CodeSmellsCount = table.Column<int>(type: "integer", nullable: false),
                    TestCoverageImpact = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CodeComplexity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OverallConfidenceScore = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ExecutiveSummary = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsTracked = table.Column<bool>(type: "boolean", nullable: false),
                    IsWebhook = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiReviewSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PrInsights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RepositoryFullName = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    PrNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AiSummary = table.Column<string>(type: "text", nullable: true),
                    RiskLevel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrInsights", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Prompt = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GitHubId = table.Column<long>(type: "bigint", nullable: false),
                    Username = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AccessToken = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    IsEmailAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiReviewIssues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AiReviewSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StartLine = table.Column<int>(type: "integer", nullable: false),
                    EndLine = table.Column<int>(type: "integer", nullable: false),
                    Author = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    IssueType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SuggestedRemovedCode = table.Column<string>(type: "text", nullable: true),
                    SuggestedAddedCode = table.Column<string>(type: "text", nullable: true),
                    IsIgnored = table.Column<bool>(type: "boolean", nullable: false),
                    IsCommented = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "ReviewComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PrInsightId = table.Column<Guid>(type: "uuid", nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    LineNumber = table.Column<int>(type: "integer", nullable: false),
                    Side = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    SuggestedCode = table.Column<string>(type: "text", nullable: true),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    IsAiGenerated = table.Column<bool>(type: "boolean", nullable: false),
                    IsPostedToGitHub = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewComments_PrInsights_PrInsightId",
                        column: x => x.PrInsightId,
                        principalTable: "PrInsights",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RuleConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RepositoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    RepositoryFullName = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    RuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RuleConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RuleConfigs_Rules_RuleId",
                        column: x => x.RuleId,
                        principalTable: "Rules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrackedIssues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PullRequestNumber = table.Column<int>(type: "integer", nullable: false),
                    AiReviewIssueId = table.Column<Guid>(type: "uuid", nullable: false),
                    TrackedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StartLine = table.Column<int>(type: "integer", nullable: false),
                    EndLine = table.Column<int>(type: "integer", nullable: false),
                    Author = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    IssueType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SuggestedRemovedCode = table.Column<string>(type: "text", nullable: true),
                    SuggestedAddedCode = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    OpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackedIssues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrackedIssues_Users_TrackedByUserId",
                        column: x => x.TrackedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiReviewIssues_AiReviewSessionId",
                table: "AiReviewIssues",
                column: "AiReviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_PrInsights_RepositoryFullName_PrNumber",
                table: "PrInsights",
                columns: new[] { "RepositoryFullName", "PrNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReviewComments_PrInsightId",
                table: "ReviewComments",
                column: "PrInsightId");

            migrationBuilder.CreateIndex(
                name: "IX_RuleConfigs_RuleId",
                table: "RuleConfigs",
                column: "RuleId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackedIssues_TrackedByUserId",
                table: "TrackedIssues",
                column: "TrackedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_GitHubId",
                table: "Users",
                column: "GitHubId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiReviewIssues");

            migrationBuilder.DropTable(
                name: "ReviewComments");

            migrationBuilder.DropTable(
                name: "RuleConfigs");

            migrationBuilder.DropTable(
                name: "TrackedIssues");

            migrationBuilder.DropTable(
                name: "AiReviewSessions");

            migrationBuilder.DropTable(
                name: "PrInsights");

            migrationBuilder.DropTable(
                name: "Rules");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
