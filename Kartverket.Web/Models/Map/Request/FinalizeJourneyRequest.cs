namespace Kartverket.Web.Models.Map.Request;

// TODO: Validation
public class FinalizeJourneyObject
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public bool Deleted { get; set; } = false;
    public List<FinalizeJourneyPointDataModel> Points { get; set; }
    public Guid? TypeId { get; set; } = null;
    public string? CustomType { get; set; } = null;
}

public class FinalizeJourneyDataModel
{
    public string Title { get; set; } = "Ny tur";
    public string Description { get; set; } = "";
}

public class FinalizeJourneyPointDataModel
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public int Elevation { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FinalizeJourneyRequest
{
    public List<FinalizeJourneyObject> Objects { get; set; } = [];
    public FinalizeJourneyDataModel Journey { get; set; }
}
