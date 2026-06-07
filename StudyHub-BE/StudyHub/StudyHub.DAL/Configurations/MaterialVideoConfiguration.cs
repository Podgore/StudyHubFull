using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.Configurations;

public class MaterialVideoConfiguration : IEntityTypeConfiguration<MaterialVideo>
{
    public void Configure(EntityTypeBuilder<MaterialVideo> builder)
    {
        builder.HasOne(f => f.Material)
            .WithOne(m => m.Video)
            .HasForeignKey<MaterialVideo>(f => f.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}