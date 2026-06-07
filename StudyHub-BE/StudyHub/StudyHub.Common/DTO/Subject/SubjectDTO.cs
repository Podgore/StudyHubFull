using StudyHub.Common.DTO.User;

namespace StudyHub.Common.DTO.Subject;

public class SubjectDTO
{
    public Guid Id { get; set; }
    public UserDTO Teacher { get; set; } = new UserDTO();
    public string Title { get; set; } = string.Empty;
}