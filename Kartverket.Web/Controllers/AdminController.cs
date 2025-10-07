using Kartverket.Web.Database;
using Kartverket.Web.Models.Admin;
using Kartverket.Web.Models.Admin.Request;
using Microsoft.AspNetCore.Mvc;
namespace Kartverket.Web.Controllers;

[Controller]
public class AdminController: Controller
{
    private readonly ILogger<AdminController> _logger;
    private readonly DatabaseContext _dbContext;
    
    public AdminController(ILogger<AdminController> logger, DatabaseContext ctx)
    {
        _logger = logger;
        _dbContext = ctx;
    }
    
    public IActionResult Index()
    {
        var reports =  _dbContext.Reports;
        var Model = new GetAllReportsModel();
        foreach (var report in reports)
        {
            Model.Reports.Add(new GetAllReportsModel.MakeReportList
            {
                Id = report.Id,
                Title = report.Title,
                CreatedAt = report.CreatedAt
            });
        }
        return View(Model);
    }

    [HttpGet]
    public IActionResult ObjectTypes()
    {
        var types = _dbContext
            .MapObjectTypes
            .ToList()
            .Select(o => new AdminObjectTypeViewModel
            {
                Id = o.Id,
                Name = o.Name
            });
        
        return View(types);
    }
}
