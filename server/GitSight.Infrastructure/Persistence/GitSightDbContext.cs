using GitSight.Application.Common.Interfaces;
using GitSight.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitSight.Infrastructure.Persistence;

public class GitSightDbContext : DbContext, IApplicationDbContext
{
    public GitSightDbContext(DbContextOptions<GitSightDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Repository> Repositories => Set<Repository>();
    public DbSet<PullRequest> PullRequests => Set<PullRequest>();
    public DbSet<ReviewComment> ReviewComments => Set<ReviewComment>();
    public DbSet<AiReviewSession> AiReviewSessions => Set<AiReviewSession>();
    public DbSet<AiReviewIssue> AiReviewIssues => Set<AiReviewIssue>();
    public DbSet<PrInsight> PrInsights => Set<PrInsight>();
    public DbSet<TrackedIssue> TrackedIssues => Set<TrackedIssue>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.GitHubId).IsUnique();
            entity.Property(u => u.Username).IsRequired().HasMaxLength(150);
            entity.Property(u => u.AccessToken).IsRequired();

            entity.HasMany(u => u.Repositories)
                  .WithOne(r => r.User)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Repository Configuration
        modelBuilder.Entity<Repository>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.GitHubRepoId);
            entity.Property(r => r.Name).IsRequired().HasMaxLength(200);
            entity.Property(r => r.FullName).IsRequired().HasMaxLength(400);
            entity.Property(r => r.Owner).IsRequired().HasMaxLength(150);

            entity.HasMany(r => r.PullRequests)
                  .WithOne(pr => pr.Repository)
                  .HasForeignKey(pr => pr.RepositoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // PullRequest Configuration
        modelBuilder.Entity<PullRequest>(entity =>
        {
            entity.HasKey(pr => pr.Id);
            entity.HasIndex(pr => new { pr.RepositoryId, pr.PrNumber }).IsUnique();
            entity.Property(pr => pr.Title).IsRequired().HasMaxLength(500);
            entity.Property(pr => pr.HeadSha).HasMaxLength(100);
        });

        // ReviewComment Configuration
        modelBuilder.Entity<ReviewComment>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(c => c.Side).HasMaxLength(10);
            entity.Property(c => c.Comment).IsRequired();

            entity.HasOne(c => c.PrInsight)
                  .WithMany(p => p.Comments)
                  .HasForeignKey(c => c.PrInsightId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // AiReviewSession Configuration
        modelBuilder.Entity<AiReviewSession>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.OverallConfidenceScore).HasColumnType("decimal(18,2)");
            entity.Property(s => s.TestCoverageImpact).HasColumnType("decimal(18,2)");
            
            // One-to-Many with Issues
            entity.HasMany(s => s.Issues)
                  .WithOne(i => i.Session)
                  .HasForeignKey(i => i.AiReviewSessionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // AiReviewIssue Configuration
        modelBuilder.Entity<AiReviewIssue>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(i => i.IssueType).HasMaxLength(100);
            entity.Property(i => i.Severity).HasMaxLength(50);
        });

        // PrInsight Configuration
        modelBuilder.Entity<PrInsight>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => new { p.RepositoryFullName, p.PrNumber }).IsUnique();
            entity.Property(p => p.RepositoryFullName).IsRequired().HasMaxLength(400);
            entity.Property(p => p.Status).HasConversion<string>();
            entity.Property(p => p.Priority).HasConversion<string>();
        });

        // TrackedIssue Configuration
        modelBuilder.Entity<TrackedIssue>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(t => t.IssueType).HasMaxLength(100);
            entity.Property(t => t.Severity).HasMaxLength(50);
        });
    }
}
