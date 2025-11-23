using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Models.Report;
using Kartverket.Web.Models.Report.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

[Authorize]
public class ReportController : Controller
{
    private const int ReportPerPage = 10;

    private readonly DatabaseContext _dbContext;

    public ReportController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    ///     En side for å liste rapporter med paginering og filtrering.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Index(ReportIndexViewModel model, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return View(model);

        var reportQuery = _dbContext.Reports
            .Where(r => DateOnly.FromDateTime(r.CreatedAt) <= model.SortDate)
            .AsQueryable();

        if (model.SortStatus is { } status)
            reportQuery = reportQuery.Where(r => r.ReviewStatus == status);

        var totalReports = await reportQuery.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalReports / (double)ReportPerPage);

        reportQuery = model.SortOrder == SortOrder.Ascending
            ? reportQuery.OrderBy(r => r.CreatedAt)
            : reportQuery.OrderByDescending(r => r.CreatedAt);

        var reports = await reportQuery
            .Skip((model.Page - 1) * ReportPerPage)
            .Take(ReportPerPage)
            .Include(r => r.ReportedBy)
            .Include(r => r.HindranceObjects)
            .ToListAsync(cancellationToken);

        model.CurrentPage = model.Page;
        model.TotalPages = totalPages;
        model.Reports = reports.Select(r => new ReportIndexViewModel.Report
        {
            Id = r.Id,
            User = r.ReportedBy?.UserName ?? "Ukjent",
            Title = r.Title,
            CreatedAt = r.CreatedAt,
            Review = r.ReviewStatus,
            TotalObjects = r.HindranceObjects.Count
        }).ToList();

        return View(model);
    }

    /// <summary>
    ///     En side for å vise detaljer om en rapport og dens objekter.
    /// </summary>
    [HttpGet("Report/Details/{reportId:guid}/{objectId:guid?}")]
    public async Task<IActionResult> Details(ReportDetailsViewModel model,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return View(model);

        var report = await _dbContext.Reports
            .Where(r => r.Id == model.ReportId)
            .Include(r => r.ReportedBy)
            .Include(r => r.HindranceObjects)
            .ThenInclude(ho => ho.HindrancePoints)
            .FirstOrDefaultAsync(cancellationToken);

        if (report is null)
        {
            ModelState.AddModelError(string.Empty, "Rapporten ble ikke funnet.");

            return View("ErrorView", model);
        }

        var selectedObject = report.HindranceObjects
            .FirstOrDefault(ho => ho.Id == model.ObjectId);

        model.ReportId = report.Id;
        model.Title = report.Title;
        model.Description = report.Description;
        model.CreatedAt = report.CreatedAt;

        foreach (var obj in report.HindranceObjects)
        {
            var objectModel = new ReportDetailsViewModel.ObjectDataModel
            {
                Id = obj.Id,
                Title = obj.Title,
                Description = obj.Description,
                TypeId = obj.HindranceTypeId,
                ObjectStatus = obj.ReviewStatus,
                VerifiedAt = obj.VerifiedAt,
                GeometryType = obj.GeometryType,
                CentroidPoint = obj.HindrancePoints.Count > 0
                    ? new Point(
                        obj.HindrancePoints.Average(p => p.Latitude),
                        obj.HindrancePoints.Average(p => p.Longitude))
                    : null,
                Points = obj.HindrancePoints
                    .OrderBy(p => p.Order)
                    .Select(p => new Point(p))
                    .ToArray()
            };

            model.Objects.Add(objectModel);

            if (selectedObject != null && obj.Id == selectedObject.Id)
                model.SelectedObject = objectModel;
        }

        return View(model);
    }

    /// <summary>
    ///     En side for å vise et objekt i en rapport med tilhørende feedback.
    /// </summary>
    [HttpGet("Report/Object/{reportId:guid}/{objectId:guid}")]
    public async Task<IActionResult> Object(ReportObjectViewModel model,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
            return View(model);

        var report = await _dbContext.Reports
            .Where(r => r.Id == model.ReportId)
            .Include(r => r.HindranceObjects)
            .ThenInclude(ho => ho.HindrancePoints)
            .Include(r => r.Feedbacks)
            .ThenInclude(f => f.FeedbackBy)
            .FirstOrDefaultAsync(cancellationToken);

        if (report is null)
        {
            ModelState.AddModelError(string.Empty, "Rapporten ble ikke funnet.");

            return View("ErrorView", model);
        }

        model.ReportId = report.Id;
        model.Title = report.Title;
        model.Description = report.Description;
        model.CreatedAt = report.CreatedAt;
        model.ReviewStatus = report.ReviewStatus;
        model.IsKartverket = User.HasAtLeastRole(RoleValue.Kartverket);

        foreach (var obj in report.HindranceObjects)
        {
            var objectModel = new ReportObjectViewModel.ObjectDataModel
            {
                Id = obj.Id,
                Title = obj.Title,
                Description = obj.Description,
                TypeId = obj.HindranceTypeId,
                ObjectStatus = obj.ReviewStatus,
                VerifiedAt = obj.VerifiedAt,
                GeometryType = obj.GeometryType,
                CentroidPoint = obj.HindrancePoints.Count > 0
                    ? new Point(
                        obj.HindrancePoints.Average(p => p.Latitude),
                        obj.HindrancePoints.Average(p => p.Longitude))
                    : null,
                Points = obj.HindrancePoints
                    .OrderBy(p => p.Order)
                    .Select(p => new Point(p))
                    .ToArray(),
                Feedbacks = report.Feedbacks
                    .Where(f => f.ReportId == report.Id)
                    .OrderBy(f => f.CreatedAt)
                    .Select(f => new ReportObjectViewModel.FeedbackModel
                    {
                        Id = f.Id,
                        Feedback = f.Feedback,
                        FeedbackType = f.FeedbackType,
                        FeedbackById = f.FeedbackById,
                        FeedbackByName = f.FeedbackBy?.UserName ?? "Ukjent",
                        CreatedAt = f.CreatedAt
                    })
                    .ToArray()
            };

            if (obj.Id == model.ObjectId)
                model.SelectedObject = objectModel;

            model.Objects.Add(objectModel);
        }

        return View(model);
    }
}
