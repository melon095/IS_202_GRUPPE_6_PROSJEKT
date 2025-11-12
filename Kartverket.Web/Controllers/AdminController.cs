using System.Security.AccessControl;
using System.Security.Claims;
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
    public IActionResult Index([FromQuery] int page = 1, [FromQuery] DateOnly? sortDate = null, [FromQuery] ReviewStatus? sortStatus = null,
        [FromQuery] string sortOrder = "desc")
    {
        sortDate ??= DateOnly.FromDateTime(DateTime.Now);
        // Pagnering når det er for mange rapporter
        // Sorterer etter dato
        var reportQuery = _dbContext.Reports.AsQueryable();

        reportQuery = reportQuery
            .Where(r => DateOnly.FromDateTime(r.CreatedAt) <= sortDate.Value);

        if(sortStatus != null)
        {
            reportQuery = reportQuery.Where(r => r.ReviewStatus == sortStatus.Value);
        }



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
            SortDate = sortDate.Value,
            SortStatus = sortStatus
            
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
        if (report == null) return View("ErrorView");

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
                ObjectStatus = objects.ReviewStatus,
                VerifiedAt = objects.VerifiedAt
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
    public IActionResult ObjectReview(Guid id, [FromQuery] Guid? objectID)
    {
        var report = _dbContext.Reports
            .Include(r => r.HindranceObjects)
            .ThenInclude(o => o.HindrancePoints)
            .Include(r => r.Feedbacks)
            .ThenInclude(f => f.FeedbackBy)
            .FirstOrDefault(r => r.Id == id);

        if (report == null) return View("ErrorView");

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
                VerifiedAt = obj.VerifiedAt
            };
            objectData.Feedbacks = report.Feedbacks
                .Where(f => f.ReportId == report.Id)
                .OrderByDescending(f => f.CreatedAt)
                .Select( f => new ObjectReviewModel.FeedBackModel
                {
                    Id = f.Id,
                    Feedback = f.Feedback,
                    FeedbackType = f.FeedbackType,
                    FeedbackById = f.FeedbackById,
                    FeedbackByName = f.FeedbackBy?.UserName ?? string.Empty,
                    CreatedAt = f.CreatedAt
                }).ToList();

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
    public IActionResult ObjectReview(Guid id, Guid objectId, ObjectReviewAction StatusObject)
    {
        var report = _dbContext.Reports
            .Include(r => r.HindranceObjects)
            .ThenInclude(o => o.HindrancePoints)
            .Include(r => r.Feedbacks)
            .FirstOrDefault(r => r.Id == id);

        if (report == null)
            return View("ErrorView");

        var selectedObject = report.HindranceObjects.SingleOrDefault(x => x.Id == objectId);
        if (selectedObject == null)
        {
            ModelState.AddModelError("", "Objektet ble ikke funnet");
            return View("ErrorView");
        }

        selectedObject.ReviewStatus = StatusObject switch
        {
            ObjectReviewAction.Accept => ReviewStatus.Resolved,
            ObjectReviewAction.Deny => ReviewStatus.Closed,
            _ => throw new ArgumentOutOfRangeException(nameof(StatusObject), "Ugyldig status valgt")
        };
        selectedObject.VerifiedAt = DateTime.UtcNow;

        var reportVerify = report.HindranceObjects;


        var notReviewed = reportVerify.Where(o => o.ReviewStatus == ReviewStatus.Draft).ToList();
        var rejectedObjects = reportVerify.Where(o => o.ReviewStatus == ReviewStatus.Closed).ToList();

        // Alle objekter er gjennomgått
        if (notReviewed.Count == 0)
        {
            report.ReviewStatus = ReviewStatus.Resolved;
            _logger.LogInformation("Alle objekter i rapporten er vurdert ({ID})", report.Id);
        }

        // Alle objekter er avslått
        if (rejectedObjects.Count == reportVerify.Count)
        {
            report.ReviewStatus = ReviewStatus.Closed;
            _logger.LogInformation("Rapport rejecta! ({ID})", report.Id);
        }

        _dbContext.SaveChanges();

        TempData["Success"] = $"Objekt status endret til {selectedObject.ReviewStatus.GetDisplayName()}";
        return RedirectToAction("ObjectReview", new {id, objectId});    
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Comment(Guid id, Guid objectID, string feedbackText, FeedbackType feedbackType)
    {
        if (string.IsNullOrWhiteSpace(feedbackText))
        {
            ModelState.AddModelError("", "Tilbakemeldingen kan ikke være tom");
            return RedirectToAction("ObjectReview", new { id, objectID });
        }
        var report = _dbContext.Reports
            .Include(r => r.Feedbacks)
            .ThenInclude(r => r.FeedbackBy )
            .Include(r => r.HindranceObjects)
            .FirstOrDefault(r => r.Id == id);

        if (report == null)
            return View("ErrorView");

        var obj = report.HindranceObjects.FirstOrDefault(o => o.Id == objectID);
        if(obj == null)
        {
            ModelState.AddModelError("", "Objektet ble ikke funnet");
            return RedirectToAction("ObjectReview", new { id, objectID });
        }

        var ClaimUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if(!Guid.TryParse(ClaimUserId, out var userId))
        {
            return Unauthorized();
        }    
        var feedback = new ReportFeedbackTable
        {
            Id = Guid.NewGuid(),
            Feedback = feedbackText,
            FeedbackType = feedbackType,
            FeedbackById = userId,
            ReportId = report.Id,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ReportFeedbacks.Add(feedback);
        _dbContext.SaveChanges();

        TempData["Success"] = "Tilbakemeldingen er sendt";
        return RedirectToAction("ObjectReview", new { id, objectID });
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
