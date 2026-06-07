namespace StudyHub.Common.DTO.Lecture;

public class UpdateLectureDTO
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime LectureDate { get; set; }
}
