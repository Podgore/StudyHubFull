using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.Configurations;

public class MaterialContentConfiguration : IEntityTypeConfiguration<MaterialContent>
{
    public void Configure(EntityTypeBuilder<MaterialContent> builder)
    {
        builder.HasOne(f => f.Material)
            .WithOne(m => m.ContentDetail)
            .HasForeignKey<MaterialContent>(f => f.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}