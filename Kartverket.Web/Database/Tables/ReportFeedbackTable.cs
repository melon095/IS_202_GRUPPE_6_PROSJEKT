namespace Kartverket.Web.Database.Tables;

public enum FeedbackStatus
{
    New,
    InProgress,
    Resolved,
    Closed
}

public class ReportFeedbackTable : BaseModel
{
    public Guid Id { get; set; }
    public required FeedbackStatus Status { get; set; }
    public required string Feedback { get; set; }
    
    public Guid ReportId { get; set; }
    public ReportTable Report { get; set; }
}