using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class HomeworkSubmissionAttachment : EntityBase
{
    public string FileName { get; set; } = string.Empty;

    public string StoragePath { get; set; } = string.Empty;

    public string MimeType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    [ForeignKey(nameof(HomeworkSubmission))]
    public Guid HomeworkSubmissionId { get; set; }

    public HomeworkSubmission HomeworkSubmission { get; set; } = null!;
}