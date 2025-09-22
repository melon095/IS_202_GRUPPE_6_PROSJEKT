namespace Kartverket.Web.Database.Tables;

public class MapObjectTypeTable : BaseModel
{
    public Guid Id { get; set; }

    public required string Name { get; set; } 
    
    public List<MapObjectTable> MapObjects { get; set; }
}
