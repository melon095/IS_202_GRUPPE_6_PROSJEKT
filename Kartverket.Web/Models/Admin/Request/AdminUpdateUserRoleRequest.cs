namespace Kartverket.Web.Models.Admin.Request;

public class AdminUpdateUserRoleRequest
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
}
