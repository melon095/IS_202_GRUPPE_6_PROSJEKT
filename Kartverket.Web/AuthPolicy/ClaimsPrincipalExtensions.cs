using System.Security.Claims;

namespace Kartverket.Web.AuthPolicy;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    ///     Sjekker om brukeren har minst den angitte rollen basert på rolle-hierarkiet definert i MinimumRoleHandler.
    /// </summary>
    public static bool HasAtLeastRole(this ClaimsPrincipal user, string minimumRole)
    {
        foreach (var role in MinimumRoleHandler.RoleHierarchy.Keys)
        {
            var l = MinimumRoleHandler.RoleHierarchy[role];
            var r = MinimumRoleHandler.RoleHierarchy[minimumRole];

            // Sjekk om brukeren har rollen og om rollen er lik eller høyere enn minimumsrollen
            if (user.IsInRole(role) && l >= r) return true;
        }

        return false;
    }
}
