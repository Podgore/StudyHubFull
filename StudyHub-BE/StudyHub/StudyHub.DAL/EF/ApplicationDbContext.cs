using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StudyHub.Entities;

namespace StudyHub.DAL.EF;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public DbSet<Assignment> Assignments { get; set; } = null!;
    public DbSet<AssignmentAttachment> AssignmentAttachments { get; set; } = null!;
    public DbSet<HomeworkSubmission> HomeworkSubmissions { get; set; } = null!;
    public DbSet<HomeworkSubmissionAttachment> HomeworkSubmissionAttachments { get; set; } = null!;
    public DbSet<AssignmentTask> AssignmentTasks { get; set; } = null!;
    public DbSet<InvitedUser> InvitedUsers { get; set; } = null!;
    public DbSet<Lecture> Lectures { get; set; } = null!;
    public DbSet<LectureMaterial> LectureMaterials { get; set; } = null!;
    public DbSet<MaterialContent> MaterialContents { get; set; } = null!;
    public DbSet<MaterialFile> MaterialFiles { get; set; } = null!;
    public DbSet<MaterialVideo> MaterialVideos { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<StartingTimeRecord> StartingTimeRecords { get; set; } = null!;
    public DbSet<StudentAnswer> StudentAnswers { get; set; } = null!;
    public DbSet<StudentSubject> StudentSubjects { get; set; } = null!;
    public DbSet<Subject> Subjects { get; set; } = null!;
    public DbSet<TaskOption> TaskOptions { get; set; } = null!;
    public DbSet<TaskVariant> TaskVariants { get; set; } = null!;
    public DbSet<TelegramLinkCode> TelegramLinkCodes { get; set; } = null!;
    public DbSet<TelegramNotificationLog> TelegramNotificationLogs { get; set; } = null!;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(GetType().Assembly);

        base.OnModelCreating(modelBuilder);
    }
}