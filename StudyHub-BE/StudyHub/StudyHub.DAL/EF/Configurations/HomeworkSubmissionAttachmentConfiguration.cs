using Microsoft.EntityFrameworkCore;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

using StudyHub.Entities;



namespace StudyHub.DAL.EF.Configurations;



public class HomeworkSubmissionAttachmentConfiguration : IEntityTypeConfiguration<HomeworkSubmissionAttachment>

{

    public void Configure(EntityTypeBuilder<HomeworkSubmissionAttachment> builder)

    {

        builder.HasOne(x => x.HomeworkSubmission)

            .WithMany(s => s.Attachments)

            .HasForeignKey(x => x.HomeworkSubmissionId)

            .OnDelete(DeleteBehavior.Cascade);

    }

}

