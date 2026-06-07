namespace StudyHub.Common.Requests;

public class MarkForSubjectRequest
{
    public Guid StudentId { get; set; }
    public Guid SubjectId { get; set; }
    public double Mark { get; set; }
}
