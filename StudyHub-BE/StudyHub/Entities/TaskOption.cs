using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class TaskOption : EntityBase
{
    public string? Label { get; set; } = null;
    public bool? IsCorrect { get; set; }

    [ForeignKey(nameof(TaskVariant))]
    public Guid TaskVariantId { get; set; }

    public TaskVariant TaskVariant { get; set; } = null!;
    public List<StudentAnswer> StudentAnswers{ get; set; } = null!;
}