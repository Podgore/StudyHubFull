using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class StudentAnswer : EntityBase
{
    public string? Answer { get; set; } = null!;
    public double Mark { get; set; }

    public bool OpenEndedTeacherReviewed { get; set; }

    public string? OpenEndedTeacherFeedback { get; set; }

    [ForeignKey(nameof(TaskVariant))]
    public Guid TaskVariantId { get; set; }

    [ForeignKey(nameof(User))]
    public Guid StudentId { get; set; }

    public TaskVariant TaskVariant { get; set; } = null!;
    public User User { get; set; } = null!;
    public List<TaskOption> TaskOptions { get; set; } = null!;
}
