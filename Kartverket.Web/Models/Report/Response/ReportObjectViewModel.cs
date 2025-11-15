using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Models.Report.Response;

public enum ObjectReviewAction
{
    Accept,
    Deny
}

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

    public class ObjectDataModel
    {
        public Guid Id { get; set; }
        public Point? CentroidPoint { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public ReviewStatus ObjectStatus { get; set; }
        public List<Point> Points { get; set; } = [];
        public List<FeedbackModel> Feedbacks { get; set; } = [];

        public DateTime? VerifiedAt { get; set; }
        public bool IsVerified => VerifiedAt.HasValue;
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
