using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.Map.Request;

/// <summary>
///     Data modell for et plassert objekt på kartet.
/// </summary>
public class PlacedObjectDataModel
{
    public List<PlacedPointDataModel> Points { get; set; } = [];
    public Guid? TypeId { get; set; } = null;
    public GeometryType GeometryType { get; set; }
    public DateTime CreatedAt { get; set; }
}
