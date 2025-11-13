using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.ObjectTypes.Response;

public class ObjectTypesDataModel
{
    public List<ObjectType> ObjectTypes { get; set; } = [];

    // @NOTE: Diksjonær nøkkel må være av typen int for at JSON skal serialiseres korrekt til JavaScript,
    //        ellers blir nøkkelen tolket som en streng.
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
