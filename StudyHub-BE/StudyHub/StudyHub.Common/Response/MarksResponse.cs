using StudyHub.Common.DTO.Assignment;
using StudyHub.Common.DTO.Subject;

namespace StudyHub.Common.Response;

public class MarksResponse
{
    public SubjectDTO Subject { get; set; } = null!;
    public double SubjectMark { get; set; }
    public List<AssignmentMarkDTO> AssignmentMarks { get; set; } = new List<AssignmentMarkDTO>();
}
