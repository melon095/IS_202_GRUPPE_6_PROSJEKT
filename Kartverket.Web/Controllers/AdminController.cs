using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Admin;
using Kartverket.Web.Models.Admin.Request;
using Kartverket.Web.Models.Report.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

[Controller]
public class AdminController : Controller
{
    private readonly ILogger<AdminController> _logger;
    private readonly DatabaseContext _dbContext;
    private const int ReportPerPage = 10;

    public AdminController(ILogger<AdminController> logger, DatabaseContext ctx)
    {
        _logger = logger;
        _dbContext = ctx;
    }

    [HttpGet]
    [Authorize(Policy = RoleValue.AtLeastKartverket)]
    public IActionResult Index([FromQuery] int page = 1, [FromQuery] DateOnly? sortDate = null,
        [FromQuery] string sortOrder = "desc")
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
            .Include(r => r.HindranceObjects)
            .ToList();

        var Model = new GetAllReportsModel
        {
            CurrentPage = page,
            TotalPages = totalpages,
            SortDate = sortDate.Value
        };


        foreach (var report in reports)
            Model.Reports.Add(new GetAllReportsModel.MakeReportList
            {
                Id = report.Id,
                Title = report.Title,
                CreatedAt = report.CreatedAt,
                TotalObjects = report.HindranceObjects.Count,
                Review = report.ReviewStatus
            });


        ViewBag.SortOrder = sortOrder.ToLower();

        return View(Model);
    }


    [HttpGet("/Admin/ReportInDepth/{id:guid}")]
    [Authorize(Policy = RoleValue.AtLeastKartverket)]
    public IActionResult ReportInDepth(Guid id, [FromQuery] Guid? objectID)
    {
        var report = _dbContext.Reports
            .Include(r => r.ReportedBy)
            .Include(r => r.HindranceObjects)
            .ThenInclude(mo => mo.HindrancePoints)
            .FirstOrDefault(r => r.Id == id);
        if (report == null) return View("NoObjectsErr");

        var selectedObject = report.HindranceObjects
            .SingleOrDefault(x => x.Id == objectID);

        var Model = new InDepthReportModel
        {
            Id = report.Id,
            Title = report.Title,
            Description = report.Description,
            CreatedAt = report.CreatedAt
        };

        foreach (var objects in report.HindranceObjects)
        {
            var objectData = new InDepthReportModel.ObjectDataModel
            {
                Id = objects.Id,
                Title = objects.Title,
                Description = objects.Description,
                ObjectStatus = objects.ReviewStatus
            };
            foreach (var point in objects.HindrancePoints)
                objectData.Points.Add(new Point
                {
                    Id = point.Id,
                    Lat = point.Latitude,
                    Lng = point.Longitude,
                    Elevation = point.Elevation
                });

            if (objectData.Points.Count > 0)
            {
                var GetCentroid = new Point
                {
                    Lat = objectData.Points.Average(p => p.Lat),
                    Lng = objectData.Points.Average(p => p.Lng),
                    Elevation = 0
                };

                objectData.CentroidPoint = GetCentroid;

                Model.Objects.Add(objectData);

                if (selectedObject != null && objects.Id == selectedObject.Id) Model.SelectedObject = objectData;
            }
        }

        return View(Model);
    }

    public IActionResult ReportReview(Guid id, string Status, string StatusObject, Guid? objectID)
    {
        var report = _dbContext.Reports
            .Include(r => r.HindranceObjects)
            .ThenInclude(o => o.HindrancePoints)
            .Include(r => r.Feedbacks)
            .FirstOrDefault(r => r.Id == id);

        switch (Status)
        {
            case "accept":
                report.ReviewStatus = ReviewStatus.Resolved;
                break;
            case "deny":
                report.ReviewStatus = ReviewStatus.Closed;
                break;


            default:
                TempData["Error"] = "Feil opsto";
                break;
        }

        _dbContext.SaveChanges();
        TempData["Success"] = $"Rapport status endret til {report.ReviewStatus}";


        if (report == null) return View("NoObjectsErr");

        var selectedObject = report.HindranceObjects
            .SingleOrDefault(x => x.Id == objectID);

        var Model = new ReportReviewModel
        {
            Id = report.Id,
            Title = report.Title,
            Description = report.Description,
            CreatedAt = report.CreatedAt,
            ReviewStatus = report.ReviewStatus
        };

        foreach(var objects in report.HindranceObjects)
        {
            var objectData = new ReportReviewModel.ObjectDataModel
            {
                Id = objects.Id,
                Title = objects.Title,
                Description = objects.Description,
                ObjectStatus = objects.ReviewStatus
            };
            foreach (var points in objects.HindrancePoints)
                objectData.Points.Add(new Point
                {
                    Id = points.Id,
                    Lat = points.Latitude,
                    Lng = points.Longitude,
                    Elevation = points.Elevation
                });
            if (objectData.Points.Count > 0)
            {
                var GetCentroid = new Point
                {
                    Lat = objectData.Points.Average(p => p.Lat),
                    Lng = objectData.Points.Average(p => p.Lng),
                    Elevation = 0
                };

                objectData.CentroidPoint = GetCentroid;




                if (selectedObject != null && objects.Id == selectedObject.Id)
                {
                    switch (StatusObject)
                    {
                        case "accept":
                            selectedObject.ReviewStatus = ReviewStatus.Resolved;
                            break;
                        case "deny":
                            selectedObject.ReviewStatus = ReviewStatus.Closed;
                            break;

                        default:
                            TempData["Error"] = "Feil Oppsto";
                            break;

                    }
                    _dbContext.SaveChanges();
                    TempData["Succsess"] = $"Rapport status endret til {report.ReviewStatus}";
                    Model.SelectedObject = objectData;
                }

                Model.Objects.Add(objectData);


            }

        }
        return View(Model);
    }
    public IActionResult ObjectReview()
    {
        return View();
    }

    [HttpGet]
    public IActionResult ObjectTypes()
    {
        var types = _dbContext
            .HindranceTypes
            .ToList()
            .Select(o => new AdminObjectTypeViewModel
            {
                Id = o.Id,
                Name = o.Name
            });

        return View(types);
    }
}
