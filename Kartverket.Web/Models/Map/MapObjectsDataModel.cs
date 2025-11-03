using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.Map;

public class MapObjectsDataModel
{
    public Guid Id { get; set; }
    public Guid ReportId { get; set; }
    public Guid? TypeId { get; set; }
    public GeometryType GeometryType { get; set; }
    public string? Title { get; set; }
    public List<MapPointDataModel> Points { get; set; } = [];
}
