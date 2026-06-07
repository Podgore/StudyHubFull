using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.Configurations;

public class LectureMaterialConfiguration : IEntityTypeConfiguration<LectureMaterial>
{
    public void Configure(EntityTypeBuilder<LectureMaterial> builder)
    {
        builder.HasOne(m => m.Lecture)
            .WithMany(l => l.Materials)
            .HasForeignKey(m => m.LectureId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}