namespace Kartverket.Web.Database.Tables;

public class HindrancePointTable : BaseModel
{
    public Guid Id { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int Elevation { get; set; }
    public int Order { get; set; }
    public string Label { get; set; }

    public Guid HindranceObjectId { get; set; }
    public HindranceObjectTable HindranceObject { get; set; }
}
