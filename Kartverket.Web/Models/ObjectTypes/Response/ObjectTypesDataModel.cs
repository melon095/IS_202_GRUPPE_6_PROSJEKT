using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.ObjectTypes.Response;

public class ObjectTypesDataModel
{
    public List<ObjectType> ObjectTypes { get; set; } = [];

    public Dictionary<int, Guid> StandardTypeIds { get; set; } = [];

    public class ObjectType
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? ImageUrl { get; set; }
        public string? Colour { get; set; }
        public GeometryType GeometryType { get; set; }
    }
}
