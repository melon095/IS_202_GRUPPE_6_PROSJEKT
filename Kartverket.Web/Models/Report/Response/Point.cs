using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.Report.Response;

public struct Point
{
    public Guid Id { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double Elevation { get; set; }

    public Point(double lat, double lng)
    {
        Lat = lat;
        Lng = lng;
    }

    public Point(HindrancePointTable point)
    {
        Id = point.Id;
        Lat = point.Latitude;
        Lng = point.Longitude;
        Elevation = point.Elevation;
    }
}
