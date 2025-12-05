using Kartverket.Web.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace Kartverket.Web.Controllers;

public class HomeController : Controller
{
    /// <summary>
    ///     Hjemmeside
    /// </summary>
    public IActionResult Index() => View();

    /// <summary>
    ///     Feilsiden
    /// </summary>
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => View(new ErrorViewModel
        { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
}
