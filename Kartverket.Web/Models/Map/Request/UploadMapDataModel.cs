namespace Kartverket.Web.Models.Map.Request;

public class UploadMapDataModel
{
    public Guid ReportId { get; set; }
    public List<Point> Points { get; set; } = [];
    
    public class Point
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
        public int Eleveation { get; set; }
    }
}
