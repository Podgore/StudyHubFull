namespace StudyHub.Common.Response;

public class StudentResultResponse
{
    public List<string> AlreadyEnrolled { get; set; } = new List<string>();
    public List<string> Failed { get; set; } = new List<string>();
    public List<string> Success { get; set; } = new List<string>();
}
