namespace StudyHub.Common.Exceptions;

public class TimeOverException : Exception
{
    public TimeOverException(string? message)
        : base(message) { }
}
