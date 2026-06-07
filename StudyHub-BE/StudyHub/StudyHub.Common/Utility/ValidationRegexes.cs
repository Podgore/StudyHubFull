namespace StudyHub.Common.Utility;
public static class ValidationRegexes
{
    public const string FullNameRegex = @"^[A-Za-z\s]*$";
    public const string PasswordRegex = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,}$";
    public const string Telegram = @".*?\B@\w{5}.*";
}
