namespace Kartverket.Web.Database.Tables;

public enum GeometryType
{
    Point,
    Line,
    Polygon
}

public class HindranceTypeTable : BaseModel
{
    public Guid Id { get; set; }

    public string Name { get; set; }
    public string PrimaryImageUrl { get; set; }
    public string? MarkerImageUrl { get; set; } = null;
    public GeometryType GeometryType { get; set; }

    public List<HindranceObjectTable> MapObjects { get; set; }
}
