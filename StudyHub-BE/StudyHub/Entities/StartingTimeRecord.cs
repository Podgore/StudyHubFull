using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class StartingTimeRecord : EntityBase
{
    public DateTime StartTime { get; set; }
    public bool IsFinished { get; set; }
    public double Mark { get; set; }
    public Guid? SessionToken { get; set; }
    public string? SessionHash { get; set; }
    public string? SelectedVariantIdsJson { get; set; }

    [ForeignKey(nameof(Student))]
    public Guid StudentId { get; set; }

    [ForeignKey(nameof(Assignment))]
    public Guid AssignmentId { get; set; }

    public User Student { get; set; } = null!;
    public Assignment Assignment { get; set; } = null!;
}
