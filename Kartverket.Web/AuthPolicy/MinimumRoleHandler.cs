using Microsoft.AspNetCore.Authorization;

namespace Kartverket.Web.AuthPolicy;

public class MinimumRoleHandler : AuthorizationHandler<MinimumRoleRequirement>
{
    public static readonly Dictionary<string, int> RoleHierarchy = new()
    {
        { RoleValue.User, 1 },
        { RoleValue.Pilot, 2 },
        { RoleValue.Kartverket, 3 }
    };

    /// <summary>
    ///     Håndterer autorisasjonskravet for minimumsrolle.
    /// </summary>
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context,
        MinimumRoleRequirement requirement)
    {
        foreach (var (key, value) in RoleHierarchy)
            if (context.User.IsInRole(key) && value >= RoleHierarchy[requirement.MinimumRole])
            {
                context.Succeed(requirement);
                break;
            }

        return Task.CompletedTask;
    }
}
