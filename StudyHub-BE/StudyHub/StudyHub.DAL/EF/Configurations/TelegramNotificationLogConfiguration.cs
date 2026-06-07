using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.EF.Configurations;

public class TelegramNotificationLogConfiguration : IEntityTypeConfiguration<TelegramNotificationLog>
{
    public void Configure(EntityTypeBuilder<TelegramNotificationLog> b)
    {
        b.HasIndex(x => new { x.UserId, x.DedupeKey }).IsUnique();
        b.Property(x => x.DedupeKey).HasMaxLength(256).IsRequired();
    }
}
