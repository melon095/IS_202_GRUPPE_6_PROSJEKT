namespace Kartverket.Web.Models.Map.Request;

public class PlacedObjectDataModel
{
    public List<PlacedPointDataModel> Points { get; set; } = [];
    public Guid TypeId { get; set; }
    public string? CustomType { get; set; } = null;
    public DateTime CreatedAt { get; set; }
}