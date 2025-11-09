using System.Text.Json.Serialization;

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
    [JsonIgnore] public UserTable FeedbackBy { get; set; }

    public Guid ReportId { get; set; }
   [JsonIgnore]  public ReportTable Report { get; set; }
}
