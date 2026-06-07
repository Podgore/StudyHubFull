namespace StudyHub.Common.Exceptions;

public class RestrictedAccessException : Exception
{
    public RestrictedAccessException(string? message)
        : base(message) { }
}