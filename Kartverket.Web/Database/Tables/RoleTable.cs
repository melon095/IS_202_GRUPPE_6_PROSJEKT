using Microsoft.AspNetCore.Identity;

namespace Kartverket.Web.Database.Tables;

public class RoleTable : IdentityRole<Guid>
{
    public List<UserTable> Users { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
