namespace Kartverket.Web.Models.ObjectTypes.Response;

public class ObjectTypesResponse(List<ObjectTypesResponse.ObjectType> objectTypes)
    : List<ObjectTypesResponse.ObjectType>(objectTypes)
{
    public class ObjectType
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string PrimaryImageUrl { get; set; }
        public string? MarkerImageUrl { get; set; }
    }

}
