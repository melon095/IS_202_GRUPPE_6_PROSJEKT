using Kartverket.Web.AuthPolicy;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Kartverket.Web.Database.Tables;

public enum FeedbackStatus
{
    Draft,
    InProgress,
    Resolved,
    Closed
}

public class ReportTable : BaseModel
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required FeedbackStatus Status { get; set; }

    [NotMapped] public bool ReporterIsPilot => ReportedBy.Role?.Name == RoleValue.Pilot;
    public Guid ReportedById { get; set; }
    [JsonIgnore] public UserTable ReportedBy { get; set; }

    public List<ReportFeedbackTable> Feedbacks { get; set; }

    public List<HindranceObjectTable> HindranceObjects { get; set; }
}
