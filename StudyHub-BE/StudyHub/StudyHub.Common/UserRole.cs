namespace StudyHub.Common;

public class UserRole : IEquatable<UserRole>
{
    private UserRole(string value)
    {
        Value = value.ToUpper();
    }

    public string Value { get; private set; }

    public static UserRole Admin { get { return new UserRole("Admin"); } }
    public static UserRole Teacher { get { return new UserRole("Teacher"); } }
    public static UserRole Student { get { return new UserRole("Student"); } }

    public override string ToString()
    {
        return Value;
    }

    public bool Equals(UserRole? other)
    {
        return other?.Value.Equals(Value) ?? Value == null;
    }

    #region Operators overload

    public static bool operator ==(UserRole? left, UserRole? right)
    {
        return left?.Value == right?.Value;
    }

    public static bool operator !=(UserRole? left, UserRole? right)
    {
        return !(left?.Value == right?.Value);
    }

    public static bool operator ==(string? left, UserRole? right)
    {
        return left == right?.Value;
    }

    public static bool operator !=(string? left, UserRole? right)
    {
        return !(left == right?.Value);
    }

    public override bool Equals(object? obj)
    {
        return ((UserRole)obj!).Value.Equals(Value, StringComparison.Ordinal);
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    #endregion Operators overload
}