using System.Text.Json.Serialization;
using StudyHub.Common.Serialization;

namespace StudyHub.Common.DTO.Subject;

[JsonConverter(typeof(TeacherSubjectAssignmentGradeStatusJsonConverter))]
public enum TeacherSubjectAssignmentGradeStatus
{
    Graded,
    Pending,
    NotStarted,
    InProgress,
}
