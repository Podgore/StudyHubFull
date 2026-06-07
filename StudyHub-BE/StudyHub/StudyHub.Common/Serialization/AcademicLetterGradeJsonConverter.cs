using System.Text.Json;
using System.Text.Json.Serialization;
using StudyHub.Common.DTO.Subject;

namespace StudyHub.Common.Serialization;

public sealed class AcademicLetterGradeJsonConverter : JsonConverter<AcademicLetterGrade>
{
    public override AcademicLetterGrade Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var intValue))
            return (AcademicLetterGrade)intValue;

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException($"Unexpected token parsing {nameof(AcademicLetterGrade)}.");

        return reader.GetString() switch
        {
            "A" => AcademicLetterGrade.A,
            "B" => AcademicLetterGrade.B,
            "C" => AcademicLetterGrade.C,
            "D" => AcademicLetterGrade.D,
            "F" => AcademicLetterGrade.F,
            _ => throw new JsonException($"Unknown {nameof(AcademicLetterGrade)} value."),
        };
    }

    public override void Write(Utf8JsonWriter writer, AcademicLetterGrade value, JsonSerializerOptions options)
    {
        var s = value switch
        {
            AcademicLetterGrade.A => "A",
            AcademicLetterGrade.B => "B",
            AcademicLetterGrade.C => "C",
            AcademicLetterGrade.D => "D",
            AcademicLetterGrade.F => "F",
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
        };
        writer.WriteStringValue(s);
    }
}
