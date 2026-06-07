using Microsoft.EntityFrameworkCore;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

using StudyHub.Entities;



namespace StudyHub.DAL.EF.Configurations;



public class HomeworkSubmissionConfiguration : IEntityTypeConfiguration<HomeworkSubmission>

{

    public void Configure(EntityTypeBuilder<HomeworkSubmission> builder)

    {

        builder.HasIndex(x => new { x.StudentId, x.AssignmentId }).IsUnique();



        builder.HasOne(x => x.Assignment)

            .WithMany(a => a.HomeworkSubmissions)

            .HasForeignKey(x => x.AssignmentId)

            .OnDelete(DeleteBehavior.Cascade);



        builder.HasOne(x => x.Student)

            .WithMany()

            .HasForeignKey(x => x.StudentId)

            .OnDelete(DeleteBehavior.Cascade);

    }

}

