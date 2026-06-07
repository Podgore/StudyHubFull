using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class AssignmentTask : EntityBase
{
    public double MaxMark { get; set; }

    [ForeignKey(nameof(Assignment))]
    public Guid AssignmentId { get; set; }

    public Assignment Assignment { get; set; } = null!;
    public List<TaskVariant> TaskVariants { get; set; } = null!;
}