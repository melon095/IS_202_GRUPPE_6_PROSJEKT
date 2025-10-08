namespace Kartverket.Web.AuthPolicy;

public static class RoleValue
{
    public const string User = "User";
    public const string Pilot = "Pilot";
    public const string Kartverket = "Kartverket";
    
    public const string AtLeastUser = "AtLeastUser";
    public const string AtLeastPilot = "AtLeastPilot";
    public const string AtLeastKartverket = "AtLeastKartverket";
    
    public static readonly string[] AllRoles = [User, Pilot, Kartverket];
}
