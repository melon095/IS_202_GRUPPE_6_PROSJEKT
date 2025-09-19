namespace Kartverket.Web.Database.Tables;

public class ReportTable : BaseModel
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    
    public Guid UserId { get; set; }
    public UserTable User { get; set; }
    
    public List<ReportFeedbackTable> Feedbacks { get; set; }
    public List<MapPointTable> MapPoints { get; set; }
}