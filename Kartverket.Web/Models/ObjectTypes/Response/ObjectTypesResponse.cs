using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.ObjectTypes.Response;

public class ObjectTypesResponse(List<ObjectTypesResponse.ObjectType> objectTypes)
    : List<ObjectTypesResponse.ObjectType>(objectTypes)
{
    public class ObjectType
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? ImageUrl { get; set; }
        public string? Colour { get; set; }
        public GeometryType GeometryType { get; set; }
    }
}
