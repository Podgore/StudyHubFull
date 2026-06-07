namespace StudyHub.Common.DTO.Lecture;

public class CreateLectureDTO
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime LectureDate { get; set; }
    public List<LectureMaterialInputDTO> Materials { get; set; } = new();
}
