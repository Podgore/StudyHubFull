using System.Text.Json.Serialization;
using StudyHub.Common.Serialization;

namespace StudyHub.Common.DTO.Assignment;

[JsonConverter(typeof(HomeworkGrandingStatusJsonConverter))]
public enum HomeworkGrandingStatus
{
    Graded,
    NeedsGrading,
    NotSubmitted,
}