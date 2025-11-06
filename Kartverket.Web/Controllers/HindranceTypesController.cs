using Kartverket.Web.Database;
using Kartverket.Web.Models.HindranceTypes.Response;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

public class HindranceTypesController : Controller
{
    private readonly DatabaseContext _dbContext;

    public HindranceTypesController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<HindranceTypesResponse> List()
    {
        var hindranceTypes = await _dbContext.HindranceTypes
            .Select(ot => new HindranceTypesResponse.HindranceType
            {
                Id = ot.Id,
                Name = ot.Name,
                PrimaryImageUrl = ot.PrimaryImageUrl,
                MarkerImageUrl = ot.MarkerImageUrl
            })
            .ToListAsync();

        return new HindranceTypesResponse(hindranceTypes);
    }
}
