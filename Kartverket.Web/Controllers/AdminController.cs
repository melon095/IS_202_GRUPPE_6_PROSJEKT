using Kartverket.Web.Database;
using Kartverket.Web.Models.Admin;
using Kartverket.Web.Models.Admin.Request;
using Kartverket.Web.Models.Report.Response;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    [HttpGet("/Admin/ReportInDepth/{id:guid}")]
    public IActionResult ReportInDepth(Guid id)
    {
        var Model = new InDepthReportModel();
        var report = _dbContext.Reports
            .Include(r => r.User)
            .Include(r => r.MapPoints)
            .FirstOrDefault(r => r.Id == id);
        foreach(var point in report.MapPoints)
        {
            Model.Points.Add(new InDepthReportModel.Point
            {
                Lat = point.Latitude,
                Lng = point.Longitude,
                Elevation = point.AMSL
            });
        }
        Model.Id = report.Id;
        Model.Title = report.Title;
        Model.Description = report.Description;
        Model.CreatedAt = report.CreatedAt;
        if(report == null)
        {
            return NotFound();
        }
        return View(Model);
    }
    
    public IActionResult Index()
    {
        var reports =  _dbContext.Reports.ToList();
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
