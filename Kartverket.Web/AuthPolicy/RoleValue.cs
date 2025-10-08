namespace Kartverket.Web.AuthPolicy;

public sealed class RoleValue
{
    public static readonly RoleValue User = new("User");
    public static readonly RoleValue Pilot = new("Pilot");
    public static readonly RoleValue Kartverket = new("Kartverket");
    
    public static readonly RoleValue AtLeastUser = new("AtLeastUser");
    public static readonly RoleValue AtLeastPilot = new("AtLeastPilot");
    public static readonly RoleValue AtLeastKartverket = new("AtLeastKartverket");
    
    public string Value { get; init; }
    
    public static implicit operator string(RoleValue role) => role.Value;

    public RoleValue(string value)
    {
        Value = value;
    }
}
