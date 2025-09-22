namespace Kartverket.Web.Database.Tables;

public class ReportFeedbackAssignmentTable : BaseModel
{
    public Guid Id { get; set; }
    
    public Guid UserId { get; set; }
    public UserTable User { get; set; }
    
    public Guid ReportFeedbackId { get; set; }
    public ReportFeedbackTable ReportFeedback { get; set; }
}