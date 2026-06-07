using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class HomeworkSubmission : EntityBase
{
    public string? StudentComment { get; set; }

    public double? TeacherScore { get; set; }

    public string? TeacherFeedback { get; set; }
    public DateTime UpdatedAt { get; set; }

    [ForeignKey(nameof(Student))]
    public Guid StudentId { get; set; }

    [ForeignKey(nameof(Assignment))]
    public Guid AssignmentId { get; set; }

    public User Student { get; set; } = null!;
    public Assignment Assignment { get; set; } = null!;
    public List<HomeworkSubmissionAttachment> Attachments { get; set; } = null!;
}