namespace StudyHub.Common.Configs;

public class LectureMaterialsConfig : ConfigBase
{
    public string Folder { get; set; } = string.Empty;
    public List<string> FileExtensions { get; set; } = null!;
    public List<string> VideoFileExtensions { get; set; } = new() { ".mp4", ".webm", ".ogg", ".mov" };
}
