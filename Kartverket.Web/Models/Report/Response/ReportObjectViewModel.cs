using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Models.Report.Response;

/// <summary>
///     Handlinger som kan utføres på et rapportert objekt
/// </summary>
public enum ObjectReviewAction
{
    Accept,
    Deny
}

/// <summary>
///     ViewModel for et rapportert objekt i en rapport
/// </summary>
public class ReportObjectViewModel
{
    [FromRoute] public Guid ReportId { get; set; }
    [FromRoute] public Guid ObjectId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ReviewStatus? ReviewStatus { get; set; }
    public ObjectDataModel? SelectedObject { get; set; }

    public string? SuccessMessage { get; set; }
    public DateTime CreatedAt { get; set; }

    public bool IsKartverket { get; set; }

    public List<ObjectDataModel> Objects { get; set; } = [];

    public class ObjectDataModel : IMapObject
    {
        public Guid Id { get; set; }
        public Guid TypeId { get; set; }
        public Point? CentroidPoint { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public ReviewStatus ObjectStatus { get; set; }
        public Point[] Points { get; set; } = [];
        public FeedbackModel[] Feedbacks { get; set; } = [];

        public DateTime? VerifiedAt { get; set; }
        public bool IsVerified => VerifiedAt.HasValue;

        public GeometryType GeometryType { get; set; }
    }

    public class FeedbackModel
    {
        public Guid Id { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public FeedbackType FeedbackType { get; set; }
        public Guid FeedbackById { get; set; }
        public string FeedbackByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
