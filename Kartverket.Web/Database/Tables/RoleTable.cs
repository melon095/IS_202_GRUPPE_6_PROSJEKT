namespace Kartverket.Web.Database.Tables;

public class RoleTable : BaseModel
{
    public Guid Id { get; set; }
    public required string Name { get; set; } 
    
    public List<UserTable> Users { get; set; }
}