using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Database;

namespace Kartverket.Web.Models.Report.Response;

public class ObjectReviewModel
{
    public Guid Id { get; set; }
    public string Title { get; set; }

    public string Description { get; set; }
    public ReviewStatus ReviewStatus { get; set; }
    public ObjectDataModel? SelectedObject { get; set; }
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

    }

    public class FeedBackModel
    {
        public ReviewStatus ReviewStatus { get; set; }
        public FeedbackType FeedBack { get; set; }
    }
}
