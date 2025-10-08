namespace Kartverket.Web.AuthPolicy;

public static class RoleValue
{
    public static readonly string User = "User";
    public static readonly string Pilot = "Pilot";
    public static readonly string Kartverket = "Kartverket";
    
    public static readonly string AtLeastUser = "AtLeastUser";
    public static readonly string AtLeastPilot = "AtLeastPilot";
    public static readonly string AtLeastKartverket = "AtLeastKartverket";
}
