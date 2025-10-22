namespace Kartverket.Web.Database.Tables;

public enum FeedbackType
{
    RequestForChange,
    Approval,
    Rejection,
    Note
}

public class ReportFeedbackTable : BaseModel
{
    public Guid Id { get; set; }
    public string Feedback { get; set; }

    public FeedbackType FeedbackType { get; set; }

    public Guid FeedbackById { get; set; }
    public UserTable FeedbackBy { get; set; }

    public Guid ReportId { get; set; }
    public ReportTable Report { get; set; }
}
