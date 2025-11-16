using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.Report.Response;

public enum ObjectReviewActionOld
{
    Accept,
    Deny
}

public class ObjectReviewModel
{
    public Guid Id { get; set; }
    public string Title { get; set; }

    public string Description { get; set; }
    public ReviewStatus? ReviewStatus { get; set; }
    public ObjectDataModel? SelectedObject { get; set; }

    public string? SuccsessMessage { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<ObjectDataModel> Objects { get; set; } = [];


    public class ObjectDataModel
    {
        public Guid Id { get; set; }
        public Point CentroidPoint { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public ReviewStatus ObjectStatus { get; set; }
        public List<Point> Points { get; set; } = [];
        public List<FeedBackModel> Feedbacks { get; set; } = [];

        public DateTime? VerifiedAt { get; set; }
        public bool IsVerified => VerifiedAt.HasValue;
    }

    public class FeedBackModel
    {
        public Guid Id { get; set; }
        public string Feedback { get; set; }
        public FeedbackType FeedbackType { get; set; }
        public Guid FeedbackById { get; set; }
        public string FeedbackByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
