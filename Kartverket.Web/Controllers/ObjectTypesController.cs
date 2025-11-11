using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.ObjectTypes.Response;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

public class ObjectTypesController : Controller
{
    private static readonly GeometryType[] GEOMETRY_TYPE_VALUES = Enum.GetValues<GeometryType>();

    private readonly DatabaseContext _dbContext;

    public ObjectTypesController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ObjectTypesDataModel> List()
    {
        var objectTypes = await _dbContext.HindranceTypes
            .Select(ot => new ObjectTypesDataModel.ObjectType
            {
                Id = ot.Id,
                Name = ot.Name,
                ImageUrl = ot.ImageUrl,
                Colour = ot.Colour,
                GeometryType = ot.GeometryType
            })
            .ToListAsync();

        var standardTypeIds = new Dictionary<int, Guid>();
        foreach (var geometryType in GEOMETRY_TYPE_VALUES)
        {
            var standardType = objectTypes.FirstOrDefault(ot =>
                ot.Name == HindranceTypeTable.DEFAULT_TYPE_NAME && ot.GeometryType == geometryType);

            if (standardType != null) standardTypeIds[(int)geometryType] = standardType.Id;
        }

        return new ObjectTypesDataModel
        {
            ObjectTypes = objectTypes,
            StandardTypeIds = standardTypeIds
        };
    }
}
