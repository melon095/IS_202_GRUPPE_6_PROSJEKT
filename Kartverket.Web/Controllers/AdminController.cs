using System.Security.AccessControl;
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
[Authorize(Policy = RoleValue.AtLeastKartverket)]
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

    
    [HttpGet]
    public IActionResult ObjectReview(Guid id, Guid? objectID)
    {
        var report = _dbContext.Reports
            .Include(r => r.HindranceObjects)
            .ThenInclude(o => o.HindrancePoints)
            .Include(r => r.Feedbacks)
            .FirstOrDefault(r => r.Id == id);

        if (report == null) return View("NoObjectsErr");

        var Model = new ObjectReviewModel
        {
            Id = report.Id,
            Title = report.Title,
            Description = report.Description,
            CreatedAt = report.CreatedAt,
            ReviewStatus = report.ReviewStatus
        };
        foreach (var obj in report.HindranceObjects)
        {
            var objectData = new ObjectReviewModel.ObjectDataModel
            {
                Id = obj.Id,
                Title = obj.Title,
                Description = obj.Description,
                ObjectStatus = obj.ReviewStatus,
            };
            foreach (var points in obj.HindrancePoints)
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

                Model.Objects.Add(objectData);
            }
            if (objectID.HasValue)
                Model.SelectedObject = Model.Objects.SingleOrDefault(x => x.Id == objectID.Value);
        }
        return View(Model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult ObjectReview(Guid id, Guid objectChangeID, string statusObject)
    {
        var report = _dbContext.Reports
            .Include(r => r.HindranceObjects)
            .ThenInclude(o => o.HindrancePoints)
            .Include(r => r.Feedbacks)
            .FirstOrDefault(r => r.Id == id);

        if (report == null)
            return View("NoObjectsErr");

        var selectedObject = report.HindranceObjects.SingleOrDefault(x => x.Id == objectChangeID);
        if (selectedObject == null)
        {
            TempData["Error"] = "Objekt ikke funnet";
        }

        switch (statusObject)
        {
            case "accept":
                selectedObject.ReviewStatus = ReviewStatus.Resolved;
                break;
            case "deny":
                selectedObject.ReviewStatus = ReviewStatus.Closed;
                break;

            default:
                TempData["Error"] = "Ugyldig status";
                return RedirectToAction("ObjectReview", new { id, objectChangeID });
        }

        var reportVerify = report.HindranceObjects;

        if(reportVerify.All(o => o.ReviewStatus == ReviewStatus.Resolved))
        {
            report.ReviewStatus = ReviewStatus.Resolved;
        }
        else if (reportVerify.All(o => o.ReviewStatus == ReviewStatus.Closed))
        {
            report.ReviewStatus = ReviewStatus.Closed;
        }
        else
        {
            report.ReviewStatus = ReviewStatus.Draft;
        }

        _dbContext.SaveChanges();

        TempData["Success"] = $"Objekt status endret til {selectedObject.ReviewStatus}";
        return RedirectToAction("ObjectReview", new {id, objectChangeID});    
    }

    [HttpPost]
    public IActionResult Comment(Guid id, Guid objectID)
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
