using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Report.Response;

namespace Kartverket.Web.Models.Report;

public class MapViewModel
{
    public IEnumerable<IMapObject> MapObjects { get; set; } = [];

    public IMapObject? SelectedMapObject { get; set; }

    public string MapElementId { get; set; } = "map";
}

public interface IMapObject
{
    Guid Id { get; set; }
    string Title { get; set; }
    string Description { get; set; }
    Guid TypeId { get; set; }
    Point? CentroidPoint { get; set; }
    Point[] Points { get; set; }
    GeometryType GeometryType { get; set; }
}
