using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.Configurations;

public class MaterialFileConfiguration : IEntityTypeConfiguration<MaterialFile>
{
    public void Configure(EntityTypeBuilder<MaterialFile> builder)
    {
        builder.HasOne(f => f.Material)
            .WithOne(m => m.File)
            .HasForeignKey<MaterialFile>(f => f.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}