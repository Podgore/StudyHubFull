namespace StudyHub.Common.Requests;

public class SearchRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Page { get; set; }
    public int PageSize { get; set; }
}
