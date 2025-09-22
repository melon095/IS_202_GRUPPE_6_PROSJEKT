namespace Kartverket.Web.Database.Tables;

public class UserTable : BaseModel
{
    public Guid Id { get; set; }
    public required string UserName { get; set; }
    public required bool IsActive { get; set; }
    public required string Email { get; set; }
    
    public Guid? RoleId { get; set; }
    public RoleTable? Role { get; set; }
    
    public List<ReportFeedbackAssignmentTable> ReportFeedbackAssignments { get; set; }
    public List<ReportTable> Reports { get; set; }
}