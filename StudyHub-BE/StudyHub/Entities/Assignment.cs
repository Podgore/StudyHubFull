using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class Assignment : EntityBase
{
    public string Title { get; set; } = string.Empty;
    public double MaxMark { get; set; }
    public DateTime OpeningDate { get; set; }
    public DateTime ClosingDate { get; set; }
    public TimeSpan Duration { get; set; }

    public AssignmentKind Kind { get; set; } = AssignmentKind.TimedTest;

    public string? Instructions { get; set; }

    [ForeignKey(nameof(Lecture))]
    public Guid? LectureId { get; set; }

    public Lecture? Lecture { get; set; }

    [ForeignKey(nameof(Subject))]
    public Guid SubjectId { get; set; }

    public Subject Subject { get; set; } = null!;
    public List<AssignmentTask> Tasks { get; set; } = null!;
    public List<AssignmentAttachment> Attachments { get; set; } = null!;
    public List<HomeworkSubmission> HomeworkSubmissions { get; set; } = null!;
}