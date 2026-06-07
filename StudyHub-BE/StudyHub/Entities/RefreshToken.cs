using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class RefreshToken : EntityBase
{
    public string Token { get; set; } = string.Empty;
    public DateTime CreationDate { get; set; } = DateTime.Now;
    public DateTime ExpiryDate { get; set; }
    public bool Used { get; set; }
    public bool Invalidated { get; set; }

    [ForeignKey(nameof(User))]
    public Guid UserId { get; set; }
}
