using System.Text.Json.Serialization;
using StudyHub.Common.Serialization;

namespace StudyHub.Common.DTO.Subject;

[JsonConverter(typeof(AcademicLetterGradeJsonConverter))]
public enum AcademicLetterGrade
{
    A,
    B,
    C,
    D,
    F,
}

public static class AcademicLetterGradeCalculator
{
    public static AcademicLetterGrade FromPercent(double percent)
    {
        if (percent >= 90)
            return AcademicLetterGrade.A;
        if (percent >= 80)
            return AcademicLetterGrade.B;
        if (percent >= 70)
            return AcademicLetterGrade.C;
        if (percent >= 60)
            return AcademicLetterGrade.D;
        return AcademicLetterGrade.F;
    }
}
