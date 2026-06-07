using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class TaskVariant : EntityBase
{
    public string Label { get; set; } = string.Empty;

    [ForeignKey(nameof(AssignmentTask))]
    public Guid AssignmentTaskId { get; set; } 
    
    public AssignmentTask AssignmentTask { get; set; } = null!;
    public List<TaskOption> TaskOption { get; set; } = null!;
    public List <StudentAnswer> StudentAnswers { get; set; } = null!;
}
