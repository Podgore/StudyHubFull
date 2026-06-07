using System.Security.Cryptography;
using System.Text;

namespace StudyHub.BLL.Notifications;

internal static class DigestDedupeKeys
{
    public static string StudentDigestBatch(Guid userId, DateTimeOffset now, IEnumerable<Guid> itemIds)
    {
        var sorted = itemIds.OrderBy(id => id).ToArray();
        if (sorted.Length == 0)
            return $"student:digest:daily:{userId}:{now:yyyyMMdd}:empty";

        var payload = string.Join("|", sorted);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(payload)))[..16];
        return $"student:digest:daily:{userId}:{now:yyyyMMdd}:{hash}";
    }

    public static string StudentDigestIncludedLecture(Guid userId, Guid lectureId) =>
        $"student:digest:incl:lecture:{userId}:{lectureId}";

    public static string StudentDigestIncludedAssignmentPublished(Guid userId, Guid assignmentId) =>
        $"student:digest:incl:assignpub:{userId}:{assignmentId}";

    public static string StudentDigestIncludedAssignmentOpened(Guid userId, Guid assignmentId) =>
        $"student:digest:incl:assignopen:{userId}:{assignmentId}";
}
