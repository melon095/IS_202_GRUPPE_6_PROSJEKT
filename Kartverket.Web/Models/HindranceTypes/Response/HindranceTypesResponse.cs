namespace Kartverket.Web.Models.HindranceTypes.Response;

public class HindranceTypesResponse(List<HindranceTypesResponse.HindranceType> hindranceTypes)
    : List<HindranceTypesResponse.HindranceType>(hindranceTypes)
{
    public class HindranceType
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string PrimaryImageUrl { get; set; }
        public string? MarkerImageUrl { get; set; }
    }
}
