using System.Security.Claims;

namespace Kartverket.Web.AuthPolicy;

public static class ClaimsPrincipalExtensions
{
    public static bool HasAtleastRole(this ClaimsPrincipal user, string minimumRole)
    {
        foreach (var role in MinimumRoleHandler.RoleHierarchy.Keys)
        {
            var l = MinimumRoleHandler.RoleHierarchy[role];
            var r = MinimumRoleHandler.RoleHierarchy[minimumRole];
            
            if (user.IsInRole(role) && l >= r)
            {
                return true;
            }
        }
        
        return false;
    }
}
