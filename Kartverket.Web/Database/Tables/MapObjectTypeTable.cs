namespace Kartverket.Web.Database.Tables;

public class MapObjectTypeTable : BaseModel
{
    public Guid Id { get; set; }

    public required string Name { get; set; }
    public required string PrimaryImageUrl { get; set; }
    public required string? MarkerImageUrl { get; set; } = null;
    
    public List<MapObjectTable> MapObjects { get; set; }
}
