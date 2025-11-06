using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.Map.Request;

public class PlacedHindranceDataModel
{
    public List<PlacedPointDataModel> Points { get; set; } = [];
    public Guid? TypeId { get; set; } = null;
    public GeometryType GeometryType { get; set; }
    public DateTime CreatedAt { get; set; }
}
