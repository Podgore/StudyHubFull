namespace StudyHub.Common.Exceptions;

public class TokenValidatorException : Exception
{
    public TokenValidatorException(string? message)
        : base(message) { }
}