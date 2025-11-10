namespace Kartverket.Web.Database.Tables;

public enum GeometryType
{
    Point = 1,
    Line = 2,
    Area = 3
}

public class HindranceTypeTable : BaseModel
{
    public const string STANDARD_COLOUR = "#000000";

    public Guid Id { get; set; }

    public string Name { get; set; }
    public string? ImageUrl { get; set; }
    public GeometryType GeometryType { get; set; }
    public string Colour { get; set; } = STANDARD_COLOUR;

    public List<HindranceObjectTable> MapObjects { get; set; }
}
