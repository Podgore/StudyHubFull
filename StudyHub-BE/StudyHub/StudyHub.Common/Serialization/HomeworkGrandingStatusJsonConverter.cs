using System.Text.Json;
using System.Text.Json.Serialization;
using StudyHub.Common.DTO.Assignment;

namespace StudyHub.Common.Serialization;

public sealed class HomeworkGrandingStatusJsonConverter : JsonConverter<HomeworkGrandingStatus>
{
    public override HomeworkGrandingStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var intValue))
            return (HomeworkGrandingStatus)intValue;

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException($"Unexpected token parsing {nameof(HomeworkGrandingStatus)}.");

        return reader.GetString() switch
        {
            "graded" => HomeworkGrandingStatus.Graded,
            "needs_grading" => HomeworkGrandingStatus.NeedsGrading,
            "not_submitted" => HomeworkGrandingStatus.NotSubmitted,
            _ => throw new JsonException($"Unknown {nameof(HomeworkGrandingStatus)} value."),
        };
    }

    public override void Write(Utf8JsonWriter writer, HomeworkGrandingStatus value, JsonSerializerOptions options)
    {
        var s = value switch
        {
            HomeworkGrandingStatus.Graded => "graded",
            HomeworkGrandingStatus.NeedsGrading => "needs_grading",
            HomeworkGrandingStatus.NotSubmitted => "not_submitted",
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
        };
        writer.WriteStringValue(s);
    }
}
