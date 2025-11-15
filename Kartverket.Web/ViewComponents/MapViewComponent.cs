using Kartverket.Web.Models.Report;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.ViewComponents;

public class MapViewComponent : ViewComponent
{
    public IViewComponentResult Invoke(MapViewModel model)
        => View(model);
}
