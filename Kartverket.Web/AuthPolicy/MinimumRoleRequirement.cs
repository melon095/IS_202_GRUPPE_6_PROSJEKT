using Microsoft.AspNetCore.Authorization;

namespace Kartverket.Web.AuthPolicy;

public record MinimumRoleRequirement(RoleValue MinimumRole) : IAuthorizationRequirement;
