namespace Kartverket.Web.Models.Admin;

public class AdminUserViewModel
{
    public List<RoleDto> Roles { get; set; }
    public List<UserDto> Users { get; set; }

    public record RoleDto(Guid Id, string Name);

    public record UserDto(Guid Id, string Username, RoleDto? Role);
}
