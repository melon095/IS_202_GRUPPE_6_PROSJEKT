namespace Kartverket.Web.Database.Tables;

public class MapPointTable : BaseModel
{
    public Guid Id { get; set; }
    
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    //public int ASML { get; set; }
    
    public Guid ReportId { get; set; }
    public ReportTable Report { get; set; }
    
    public Guid MapObjectId { get; set; }
    public MapObjectTable MapObject { get; set; }
}
