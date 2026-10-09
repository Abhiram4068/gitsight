using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitSight.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateReviewCommentFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReviewComments_PullRequests_PullRequestId",
                table: "ReviewComments");

            migrationBuilder.RenameColumn(
                name: "PullRequestId",
                table: "ReviewComments",
                newName: "PrInsightId");

            migrationBuilder.RenameIndex(
                name: "IX_ReviewComments_PullRequestId",
                table: "ReviewComments",
                newName: "IX_ReviewComments_PrInsightId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewComments_PrInsights_PrInsightId",
                table: "ReviewComments",
                column: "PrInsightId",
                principalTable: "PrInsights",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReviewComments_PrInsights_PrInsightId",
                table: "ReviewComments");

            migrationBuilder.RenameColumn(
                name: "PrInsightId",
                table: "ReviewComments",
                newName: "PullRequestId");

            migrationBuilder.RenameIndex(
                name: "IX_ReviewComments_PrInsightId",
                table: "ReviewComments",
                newName: "IX_ReviewComments_PullRequestId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReviewComments_PullRequests_PullRequestId",
                table: "ReviewComments",
                column: "PullRequestId",
                principalTable: "PullRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
