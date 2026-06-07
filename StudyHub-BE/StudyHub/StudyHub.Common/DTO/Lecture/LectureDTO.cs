namespace StudyHub.Common.DTO.Lecture;

public class LectureDTO
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime LectureDate { get; set; }
    public List<LectureMaterialDTO> Materials { get; set; } = new();
}
