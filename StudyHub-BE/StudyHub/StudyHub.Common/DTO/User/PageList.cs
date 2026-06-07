namespace StudyHub.Common.DTO.User;

public class PageList<T>
{
    public List<T> Items { get; set; } = null!;
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}
