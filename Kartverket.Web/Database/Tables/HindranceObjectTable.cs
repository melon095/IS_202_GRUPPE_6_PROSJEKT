using System.ComponentModel.DataAnnotations.Schema;

namespace Kartverket.Web.Database.Tables;

public class HindranceObjectTable : BaseModel
{
    public Guid Id { get; set; }

    public string Title { get; set; }
    public string Description { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public ReviewStatus ReviewStatus { get; set; }
    public GeometryType GeometryType { get; set; }

    [NotMapped] public bool IsVerified => VerifiedAt.HasValue;
    public DateTime? VerifiedAt { get; set; }

    public Guid HindranceTypeId { get; set; }
    public HindranceTypeTable HindranceType { get; set; }

    public Guid ReportId { get; set; }
    public ReportTable Report { get; set; }

    public List<HindrancePointTable> HindrancePoints { get; set; }
}
