using System.Security.Claims;

namespace Kartverket.Web.AuthPolicy;

public static class ClaimsPrincipalExtensions
{
    public static bool HasAtleastRole(this ClaimsPrincipal user, string minimumRole)
    {
        foreach (var role in MinimumRoleHandler.RoleHierarchy.Keys)
        {
            var roleValue = new RoleValue(role);
            var minimumRoleValue = new RoleValue(minimumRole);
            
            if (user.IsInRole(roleValue) && MinimumRoleHandler.RoleHierarchy[roleValue] >= MinimumRoleHandler.RoleHierarchy[minimumRoleValue])
            {
                return true;
            }
        }
        
        return false;
    }
}
