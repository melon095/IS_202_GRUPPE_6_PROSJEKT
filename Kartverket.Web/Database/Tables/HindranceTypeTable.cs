namespace Kartverket.Web.Database.Tables;

public enum GeometryType
{
    Point = 1,
    Line = 2,
    Area = 3
}

public class HindranceTypeTable : BaseModel
{
    public const string DEFAULT_TYPE_NAME = "Standard";

    public Guid Id { get; set; }

    public string Name { get; set; }
    public string? ImageUrl { get; set; } = null;
    public GeometryType GeometryType { get; set; }
    public string? Colour { get; set; } = null;

    public List<HindranceObjectTable> MapObjects { get; set; }
}
