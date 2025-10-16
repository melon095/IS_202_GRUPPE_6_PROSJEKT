namespace Kartverket.Web.Models.Map.Request;

public class PlacedPointDataModel
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public int Elevation { get; set; }
    public string Label { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
