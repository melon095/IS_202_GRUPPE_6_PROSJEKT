namespace Kartverket.Web.Models.Map.Request;

/// <summary>
///     Data modell for et plassert punkt på kartet.
/// </summary>
public class PlacedPointDataModel
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string Label { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
