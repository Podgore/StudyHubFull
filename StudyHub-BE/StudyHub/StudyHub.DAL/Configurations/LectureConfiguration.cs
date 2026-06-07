using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.Configurations;

public class LectureConfiguration : IEntityTypeConfiguration<Lecture>
{
    public void Configure(EntityTypeBuilder<Lecture> builder)
    {
        builder.HasOne(l => l.Subject)
            .WithMany(s => s.Lectures)
            .HasForeignKey(l => l.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
