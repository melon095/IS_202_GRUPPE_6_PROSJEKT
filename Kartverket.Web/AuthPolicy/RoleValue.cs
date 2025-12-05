namespace Kartverket.Web.AuthPolicy;

public static class RoleValue
{
    public const string Bruker = "Bruker";
    public const string Pilot = "Pilot";
    public const string Kartverket = "Kartverket";
    
    public const string AtLeastBruker = "AtLeastBruker";
    public const string AtLeastPilot = "AtLeastPilot";
    public const string AtLeastKartverket = "AtLeastKartverket";
    
    public static readonly string[] AllRoles = [Bruker, Pilot, Kartverket];
}
