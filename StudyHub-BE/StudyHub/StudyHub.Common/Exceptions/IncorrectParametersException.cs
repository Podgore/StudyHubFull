namespace StudyHub.Common.Exceptions;

public class IncorrectParametersException : Exception
{
    public IncorrectParametersException(string? message)
        : base(message) { }
}