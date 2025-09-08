using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Controllers;

[Controller]
public class AdminController: Controller
{
    private readonly ILogger<AdminController> _logger;
    
    public AdminController(ILogger<AdminController> logger)
    {
        _logger = logger;
    }
    
    public IActionResult Index()
    {
        return View();
    }
}