using System.Xml;

namespace StudyHub.BLL.Notifications;

public static class NotificationMessages
{
    public static string StudentDeadlineSoon(string title, string offsetIso) =>
        $"<b>StudyHub</b>\nAssignment <b>{Escape(title)}</b> closes soon ({FormatOffsetForDisplay(offsetIso)} before deadline).";

    public static string StudentLectureSoon(string title, string offsetIso) =>
        $"<b>StudyHub</b>\nLecture <b>{Escape(title)}</b> starts soon ({FormatOffsetForDisplay(offsetIso)} before start).";

    public static string StudentAssignmentOpened(string title) =>
        $"<b>StudyHub</b>\nAssignment <b>{Escape(title)}</b> is now open.";

    public static string StudentAssignmentPublished(string title) =>
        $"<b>StudyHub</b>\nNew assignment posted: <b>{Escape(title)}</b>.";

    public static string StudentNewLectureScheduled(string title, DateTimeOffset start) =>
        $"<b>StudyHub</b>\nNew lecture scheduled: <b>{Escape(title)}</b> on {start:yyyy-MM-dd HH:mm} UTC.";

    public static string? StudentDailyDigest(
        IReadOnlyList<(string Title, DateTimeOffset Start)> lectures,
        IReadOnlyList<string> publishedAssignments,
        IReadOnlyList<string> openedAssignments)
    {
        if (lectures.Count == 0 && publishedAssignments.Count == 0 && openedAssignments.Count == 0)
            return null;

        var lines = new List<string> { "<b>StudyHub daily digest</b>" };

        if (lectures.Count > 0)
        {
            lines.Add("\n<b>New lectures</b>");
            foreach (var (title, start) in lectures.Take(10))
                lines.Add($"• {Escape(title)} — {start:yyyy-MM-dd HH:mm} UTC");
            if (lectures.Count > 10)
                lines.Add($"…+{lectures.Count - 10} more");
        }

        if (publishedAssignments.Count > 0)
        {
            lines.Add("\n<b>New assignments</b>");
            foreach (var title in publishedAssignments.Take(10))
                lines.Add($"• {Escape(title)}");
            if (publishedAssignments.Count > 10)
                lines.Add($"…+{publishedAssignments.Count - 10} more");
        }

        if (openedAssignments.Count > 0)
        {
            lines.Add("\n<b>Now open</b>");
            foreach (var title in openedAssignments.Take(10))
                lines.Add($"• {Escape(title)}");
            if (openedAssignments.Count > 10)
                lines.Add($"…+{openedAssignments.Count - 10} more");
        }

        return string.Join("\n", lines);
    }

    public static string TeacherDeadlineSoon(string title, string offsetIso) =>
        $"<b>StudyHub</b>\nAssignment <b>{Escape(title)}</b> (your subject) closes soon ({FormatOffsetForDisplay(offsetIso)} before deadline).";

    public static string TeacherLectureSoon(string title, string offsetIso) =>
        $"<b>StudyHub</b>\nYour lecture <b>{Escape(title)}</b> starts soon ({FormatOffsetForDisplay(offsetIso)} before start).";

    public static string TeacherLowSubmissionRate(string title, int submitted, int enrolled) =>
        $"<b>StudyHub</b>\nLow submission rate for <b>{Escape(title)}</b>: {submitted}/{enrolled} before deadline.";

    public static string TeacherInstantPendingHomework(
        IReadOnlyList<string> recentTitles,
        int totalRecentCount,
        int totalQueuedCount)
    {
        var lines = string.Join("\n", recentTitles.Take(8).Select(t => $"• {Escape(t)}"));
        var more = totalRecentCount > 8 ? $"\n…+{totalRecentCount - 8} more" : "";
        return $"<b>StudyHub</b>\nPending homework grading ({totalRecentCount} updated recently, {totalQueuedCount} total queued):\n{lines}{more}";
    }

    public static string TeacherDailyDigest(int pendingTotal, int homework, int openEnded) =>
        $"<b>StudyHub daily digest</b>\nPending submissions to review: <b>{pendingTotal}</b> (homework {homework}, open-ended {openEnded}).";

    public static string TeacherWeeklyDigest(int pendingTotal, int homework, int openEnded) =>
        $"<b>StudyHub weekly digest</b>\nPending submissions: <b>{pendingTotal}</b> (homework {homework}, open-ended {openEnded}).";

    public static string TeacherDailyGradingQueue(int pendingTotal, int homework, int openEnded) =>
        $"<b>StudyHub daily digest</b>\nGrading queue: <b>{pendingTotal}</b> pending (homework {homework}, open-ended {openEnded}).";

    public static string TeacherNewHomeworkSubmission(string assignmentTitle) =>
        $"<b>StudyHub</b>\nHomework <b>{Escape(assignmentTitle)}</b> has new student work to review.";

    public static string TeacherOpenEndedNeedsReview(string assignmentTitle, string studentDisplayName) =>
        $"<b>StudyHub</b>\nTest <b>{Escape(assignmentTitle)}</b> was submitted by <b>{Escape(studentDisplayName)}</b> — open-ended answers need your review.";

    public static string FormatOffsetForDisplay(string? iso8601)
    {
        if (string.IsNullOrWhiteSpace(iso8601))
            return "the scheduled time";

        var trimmed = iso8601.Trim();
        if (!TryParseOffset(trimmed, out var offset))
            return Escape(trimmed);

        return FormatTimeSpanHumanReadable(offset);
    }

    public static bool TryParseOffset(string iso8601, out TimeSpan offset)
    {
        offset = default;
        if (string.IsNullOrWhiteSpace(iso8601))
            return false;
        try
        {
            offset = XmlConvert.ToTimeSpan(iso8601.Trim());
            return true;
        }
        catch
        {
            return false;
        }
    }

    public static DateTimeOffset ToUtc(DateTime dt) => dt.Kind switch
    {
        DateTimeKind.Utc => new DateTimeOffset(dt, TimeSpan.Zero),
        DateTimeKind.Local => new DateTimeOffset(dt.ToUniversalTime(), TimeSpan.Zero),
        _ => new DateTimeOffset(DateTime.SpecifyKind(dt, DateTimeKind.Utc), TimeSpan.Zero),
    };

    public static bool InWindow(DateTimeOffset trigger, DateTimeOffset now, TimeSpan period) =>
        trigger > now - period && trigger <= now;

    private static string FormatTimeSpanHumanReadable(TimeSpan offset)
    {
        offset = offset.Duration();
        var parts = new List<string>();

        if (offset.Days > 0)
            parts.Add(offset.Days == 1 ? "1 day" : $"{offset.Days} days");
        if (offset.Hours > 0)
            parts.Add(offset.Hours == 1 ? "1 hour" : $"{offset.Hours} hours");
        if (offset.Minutes > 0)
            parts.Add(offset.Minutes == 1 ? "1 minute" : $"{offset.Minutes} minutes");
        if (offset.Seconds > 0 && parts.Count == 0)
            parts.Add(offset.Seconds == 1 ? "1 second" : $"{offset.Seconds} seconds");

        if (parts.Count == 0)
        {
            if (offset.TotalMilliseconds is > 0 and < 1000)
                return $"{offset.TotalMilliseconds:0} milliseconds";
            return "immediately";
        }

        return parts.Count switch
        {
            1 => parts[0],
            2 => $"{parts[0]} and {parts[1]}",
            _ => string.Join(", ", parts.Take(parts.Count - 1)) + ", and " + parts[^1],
        };
    }

    private static string Escape(string? s)
    {
        if (string.IsNullOrEmpty(s))
            return "";
        return s
            .Replace("&", "&amp;", StringComparison.Ordinal)
            .Replace("<", "&lt;", StringComparison.Ordinal)
            .Replace(">", "&gt;", StringComparison.Ordinal);
    }
}
