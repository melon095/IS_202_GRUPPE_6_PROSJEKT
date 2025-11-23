using Kartverket.Web.Models.ObjectTypes.Response;
using Kartverket.Web.Services;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Controllers;

public class ObjectTypesController : Controller
{
    /// <summary>
    ///     Henter en liste over objekt typer
    /// </summary>
    public async Task<ObjectTypesDataModel> List([FromServices] IObjectTypesService objectTypesService,
        CancellationToken cancellationToken = default) =>
        await objectTypesService.List(cancellationToken);
}
