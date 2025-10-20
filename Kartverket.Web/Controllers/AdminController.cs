using Kartverket.Web.Database;
using Kartverket.Web.Models.Admin.Request;
using Kartverket.Web.Models.Admin;
using Kartverket.Web.Models.Report.Response;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace Kartverket.Web.Controllers;

[Controller]
public class AdminController: Controller
{
    private readonly ILogger<AdminController> _logger;
    private readonly DatabaseContext _dbContext;
    private const int ReportPerPage = 10;
    
    public AdminController(ILogger<AdminController> logger, DatabaseContext ctx)
    {
        _logger = logger;
        _dbContext = ctx;
    }

    [HttpGet("/Admin/ReportInDepth/{id:guid}")]
    public IActionResult ReportInDepth(Guid id, [FromQuery] Guid? objectID)
    {
        var report = _dbContext.Reports
            .Include(r => r.User)
            .Include(r => r.MapObjects)
            .ThenInclude(mo => mo.MapPoints)
            .FirstOrDefault(r => r.Id == id);
        if (report == null)
        {
            return NotFound();
        }

        var selectedObject = report.MapObjects
            .Where(x => x.Id == objectID)
            .SingleOrDefault();

        var Model = new InDepthReportModel
        {
            Id = report.Id,
            Title = report.Title,
            Description = report.Description,
            CreatedAt = report.CreatedAt,
        };

        foreach (var objects in report.MapObjects)
        {
            var objectData = new InDepthReportModel.ObjectDataModel()
            {
                Id = objects.Id,
                Title = objects.Title,
                Description = objects.Description
            };
            foreach (var point in objects.MapPoints)
            {
                objectData.Points.Add(new InDepthReportModel.ObjectDataModel.Point
                {
                    Lat = point.Latitude,
                    Lng = point.Longitude,
                    Elevation = point.AMSL
                });
            }
            Model.Objects.Add(objectData);

            if (selectedObject != null && objects.Id == selectedObject.Id)
            {
                Model.SelectedObject = objectData;
            }
        }

        return View(Model);
    }

    [HttpGet]
    public IActionResult Index([FromQuery]int page = 1, [FromQuery]DateOnly? sortDate = null, [FromQuery] string sortOrder = "desc")
    {
        sortDate ??= DateOnly.FromDateTime(DateTime.Now);
        // Pagnering når det er for mange rapporter
        // Sorterer etter dato
        var reportQuery = _dbContext.Reports.AsQueryable();

        reportQuery = reportQuery
            .Where(r => DateOnly.FromDateTime(r.CreatedAt) <= sortDate.Value);

        var totalReports = reportQuery.Count();
        var totalpages = (int)Math.Ceiling(totalReports / (double)ReportPerPage);

        reportQuery = sortOrder.ToLower() switch
        {
            "asc" => reportQuery.OrderBy(r => r.CreatedAt),
            _ => reportQuery.OrderByDescending(r => r.CreatedAt)
        };

        var reports = reportQuery
            .Skip((page - 1) * ReportPerPage)
            .Take(ReportPerPage)
            .Include(r => r.MapObjects)
            .ToList();

        var Model = new GetAllReportsModel()
        {
            CurrentPage = page,
            TotalPages = totalpages,
            SortDate = sortDate.Value
        };

        foreach (var report in reports)
        {
            Model.Reports.Add(new GetAllReportsModel.MakeReportList
            {
                Id = report.Id,
                Title = report.Title,
                CreatedAt = report.CreatedAt,
                TotalObjects = report.MapObjects.Count
            });
        }

        ViewBag.SortOrder = sortOrder.ToLower();

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
