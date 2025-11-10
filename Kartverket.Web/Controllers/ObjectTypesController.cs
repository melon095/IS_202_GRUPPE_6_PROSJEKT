using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.ObjectTypes.Response;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

public class ObjectTypesController : Controller
{
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

        var standardTypeIds = objectTypes.Where(ot => ot.Name == HindranceTypeTable.DEFAULT_TYPE_NAME)
            .Select(ot => ot.Id)
            .ToList();

        return new ObjectTypesDataModel
        {
            ObjectTypes = objectTypes,
            StandardTypeIds = standardTypeIds
        };
    }
}
