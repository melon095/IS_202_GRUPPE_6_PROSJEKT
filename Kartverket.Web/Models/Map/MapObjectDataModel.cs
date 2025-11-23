using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.Map;

/// <summary>
///     Data modell for et kartobjekt i en rapport.
/// </summary>
public class MapObjectDataModel
{
    public Guid Id { get; set; }
    public Guid ReportId { get; set; }
    public Guid TypeId { get; set; }
    public GeometryType GeometryType { get; set; }
    public string? Title { get; set; }
    public IEnumerable<MapPoint> Points { get; set; } = [];

    public string ReportedByRole { get; set; } = string.Empty;
    public Guid ReportedByUserId { get; set; }
    public ReviewStatus ReviewStatus { get; set; }

    public class MapPoint
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
