using System.Text.Json.Serialization;

namespace Kartverket.Web.Database.Tables;

public class ReportTable : BaseModel
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    
    public Guid UserId { get; set; }
    
    [JsonIgnore]
    public UserTable User { get; set; }
    
    public Guid? FeedbackId { get; set; }
    public ReportFeedbackTable? Feedback { get; set; }

    public List<MapObjectTable> MapObjects { get; set; }
}
