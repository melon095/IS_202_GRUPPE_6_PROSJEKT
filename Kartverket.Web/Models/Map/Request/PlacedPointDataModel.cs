namespace Kartverket.Web.Models.Map.Request;

public class PlacedPointDataModel
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public int    Elevation { get; set; }
    public DateTime CreatedAt { get; set; }
}