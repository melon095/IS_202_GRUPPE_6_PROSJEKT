namespace Kartverket.Web.Database.Tables;

public class MapObjectTable : BaseModel
{
    public Guid Id { get; set; }
    
    public Guid MapObjectTypeId { get; set; }
    public MapObjectTypeTable MapObjectType { get; set; }
    
    public List<MapPointTable> MapPoints { get; set; }
}
