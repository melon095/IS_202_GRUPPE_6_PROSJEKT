using Kartverket.Web.Database;
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

    public async Task<ObjectTypesResponse> List()
    {
        var objectTypes = await _dbContext.HindranceTypes
            .Select(ot => new ObjectTypesResponse.ObjectType
            {
                Id = ot.Id,
                Name = ot.Name,
                PrimaryImageUrl = ot.PrimaryImageUrl,
                MarkerImageUrl = ot.MarkerImageUrl
            })
            .ToListAsync();

        return new ObjectTypesResponse(objectTypes);
    }
}
