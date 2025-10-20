namespace Kartverket.Web.Models.Report.Response
{
    public class InDepthReportModel
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }

        public DateTime CreatedAt { get; set; }
        public ObjectDataModel? SelectedObject { get; set; }

        public List<ObjectDataModel> Objects { get; set; } = [];

        public class ObjectDataModel
        {
            public Guid Id { get; set; }
            public string Title { get; set; }
            public string Description { get; set; }
            public List<Point> Points { get; set; } = [];
            
            public struct Point
            {
                public double Lat { get; set; }
                public double Lng { get; set; }
                public double Elevation { get; set; }
            }

        }
    }
}
