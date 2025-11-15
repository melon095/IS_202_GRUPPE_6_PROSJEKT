using Kartverket.Web.Database;
using Kartverket.Web.Models.Report;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

public class ReportController : Controller
{
    private const int ReportPerPage = 10;

    private readonly DatabaseContext _dbContext;

    public ReportController(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [Authorize]
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
}
