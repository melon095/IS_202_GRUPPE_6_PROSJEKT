using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Kartverket.Web.Models;

namespace Kartverket.Web.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    private static readonly List<IndexModelPoint> Points =
    [
        new(58.14654566028351, 7.991145057860376),
        new(58.15257424406031, 7.960960858901187),
        new(58.13686167205729, 7.966491810782542)
    ];
    
    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View(new IndexModel(Points));
    }

    [HttpPost]
    public IActionResult AddPoint([FromBody] IndexModelPoint point)
    {
        Points.Add(point);

        return Ok();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
