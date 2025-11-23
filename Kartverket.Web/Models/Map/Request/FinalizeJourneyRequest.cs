using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.Map.Request;

/// <summary>
///     Representerer et objekt i en ferdigstilling av en reise.
/// </summary>
public class FinalizeJourneyObject
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public bool Deleted { get; set; } = false;
    public List<FinalizeJourneyPointDataModel> Points { get; set; }
    public Guid? TypeId { get; set; } = null;
    public GeometryType GeometryType { get; set; }
}

/// <summary>
///     Representerer data for ferdigstilling av en reise.
/// </summary>
public class FinalizeJourneyDataModel
{
    public string Title { get; set; } = "Ny tur";
    public string Description { get; set; } = "";
}

/// <summary>
///     Representerer et punkt i en ferdigstilling av en reise.
/// </summary>
public class FinalizeJourneyPointDataModel
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
///     Representerer en forespørsel om å ferdigstille en reise.
/// </summary>
public class FinalizeJourneyRequest
{
    public List<FinalizeJourneyObject> Objects { get; set; } = [];
    public FinalizeJourneyDataModel Journey { get; set; }
}
