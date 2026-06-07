using System.Text.Json;
using System.Text.Json.Serialization;
using StudyHub.Common.DTO.Subject;

namespace StudyHub.Common.Serialization;

public sealed class TeacherSubjectAssignmentGradeStatusJsonConverter : JsonConverter<TeacherSubjectAssignmentGradeStatus>
{
    public override TeacherSubjectAssignmentGradeStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var intValue))
            return (TeacherSubjectAssignmentGradeStatus)intValue;

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException($"Unexpected token parsing {nameof(TeacherSubjectAssignmentGradeStatus)}.");

        return reader.GetString() switch
        {
            "graded" => TeacherSubjectAssignmentGradeStatus.Graded,
            "pending" => TeacherSubjectAssignmentGradeStatus.Pending,
            "not_started" => TeacherSubjectAssignmentGradeStatus.NotStarted,
            "in_progress" => TeacherSubjectAssignmentGradeStatus.InProgress,
            _ => throw new JsonException($"Unknown {nameof(TeacherSubjectAssignmentGradeStatus)} value."),
        };
    }

    public override void Write(Utf8JsonWriter writer, TeacherSubjectAssignmentGradeStatus value, JsonSerializerOptions options)
    {
        var s = value switch
        {
            TeacherSubjectAssignmentGradeStatus.Graded => "graded",
            TeacherSubjectAssignmentGradeStatus.Pending => "pending",
            TeacherSubjectAssignmentGradeStatus.NotStarted => "not_started",
            TeacherSubjectAssignmentGradeStatus.InProgress => "in_progress",
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
        };
        writer.WriteStringValue(s);
    }
}
