using System.ComponentModel.DataAnnotations;

namespace StudyHub.Entities;

public abstract class EntityBase
{
    [Key]
    public Guid Id { get; set; }
}