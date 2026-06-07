using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.EF.Configurations;

public class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
{
    public void Configure(EntityTypeBuilder<Assignment> builder)
    {
        builder.HasOne(a => a.Lecture)
            .WithMany()
            .HasForeignKey(a => a.LectureId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
