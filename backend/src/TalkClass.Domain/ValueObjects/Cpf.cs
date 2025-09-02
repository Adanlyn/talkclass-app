namespace TalkClass.Domain.ValueObjects;

public readonly struct Cpf : IEquatable<Cpf>
{
    public string Value { get; }

    public Cpf(string value)
    {
        var onlyDigits = new string((value ?? "").Where(char.IsDigit).ToArray());
        if (onlyDigits.Length != 11) throw new ArgumentException("CPF inválido");
        Value = onlyDigits;
    }

    public bool Equals(Cpf other) => Value == other.Value;
    public override bool Equals(object? obj) => obj is Cpf other && Equals(other);
    public override int GetHashCode() => Value.GetHashCode();
    public static bool operator ==(Cpf left, Cpf right) => left.Equals(right);
    public static bool operator !=(Cpf left, Cpf right) => !left.Equals(right);

    public override string ToString() => Value;
}
