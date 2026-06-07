using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class StudentSubject : EntityBase
{
    [ForeignKey(nameof(Student))]
    public Guid StudentId { get; set; }
    [ForeignKey(nameof(Subject))]
    public Guid SubjectId { get; set; }
    public double Mark { get; set; }

    public User Student { get; set; } = null!;
    public Subject Subject { get; set; } = null!;
}
