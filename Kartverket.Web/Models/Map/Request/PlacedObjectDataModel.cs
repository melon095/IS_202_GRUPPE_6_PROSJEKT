namespace Kartverket.Web.Models.Map.Request;

public class PlacedObjectDataModel
{
    public List<PlacedPointDataModel> Points { get; set; } = [];
    public string TypeId { get; set; }
    public string? CustomType { get; set; } = null;
    public DateTime CreatedAt { get; set; }
}