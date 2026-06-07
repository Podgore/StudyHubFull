using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.EF.Configurations;

public class TelegramLinkCodeConfiguration : IEntityTypeConfiguration<TelegramLinkCode>
{
    public void Configure(EntityTypeBuilder<TelegramLinkCode> builder)
    {
        builder.HasIndex(x => x.Code).IsUnique();
        builder.Property(x => x.Code).HasMaxLength(64).IsRequired();
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
