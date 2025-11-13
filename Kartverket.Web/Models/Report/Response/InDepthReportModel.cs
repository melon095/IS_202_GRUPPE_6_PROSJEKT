using Kartverket.Web.Database;

namespace Kartverket.Web.Models.Report.Response
{
    public partial class InDepthReportModel
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }

        public DateTime CreatedAt { get; set; }
        public ObjectDataModel? SelectedObject { get; set; }

        public List<ObjectDataModel> Objects { get; set; } = [];

        public partial class ObjectDataModel
        {
            public Guid Id { get; set; }
            public Point CentroidPoint { get; set; }
            public string Title { get; set; }
            public string Description { get; set; }

            public ReviewStatus ObjectStatus { get; set; }
            public List<Point> Points { get; set; } = [];
            
            public DateTime? VerifiedAt { get; set; }
            public bool IsVerified => VerifiedAt.HasValue;

        }
    }
}
