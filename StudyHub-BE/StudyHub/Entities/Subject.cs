using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class Subject : EntityBase
{
    public string Title { get; set; } = string.Empty;

    [ForeignKey(nameof(Teacher))]
    public Guid TeacherId { get; set; }

    public User Teacher { get; set; } = null!;
    public List<StudentSubject> StudentSubjects { get; set; } = null!;
    public List<Assignment> Assignments { get; set; } = null!;
    public List<Lecture> Lectures { get; set; } = null!;
}