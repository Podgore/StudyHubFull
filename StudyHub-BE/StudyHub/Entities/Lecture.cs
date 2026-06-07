using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class Lecture : EntityBase
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime LectureDate { get; set; }

    [ForeignKey(nameof(Subject))]
    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
    public List<LectureMaterial> Materials { get; set; } = null!;
}
