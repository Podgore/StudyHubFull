using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudyHub.Entities;

namespace StudyHub.DAL.EF.Configurations;

public class AssignmentAttachmentConfiguration : IEntityTypeConfiguration<AssignmentAttachment>
{
    public void Configure(EntityTypeBuilder<AssignmentAttachment> builder)
    {
        builder.HasOne(x => x.Assignment)
            .WithMany(a => a.Attachments)
            .HasForeignKey(x => x.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
