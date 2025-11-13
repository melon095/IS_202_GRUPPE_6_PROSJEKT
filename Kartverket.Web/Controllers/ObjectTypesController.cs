using Kartverket.Web.Models.ObjectTypes.Response;
using Kartverket.Web.Services;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Controllers;

public class ObjectTypesController : Controller
{
    private readonly IObjectTypesService _objectTypesService;

    public ObjectTypesController(IObjectTypesService objectTypesService)
    {
        _objectTypesService = objectTypesService;
    }

    public async Task<ObjectTypesDataModel> List(CancellationToken cancellationToken = default) =>
        await _objectTypesService.List(cancellationToken);
}
