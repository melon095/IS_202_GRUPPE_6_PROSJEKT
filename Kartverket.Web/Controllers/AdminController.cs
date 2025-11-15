using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Report.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Kartverket.Web.Controllers;

[Controller]
[Authorize(Policy = RoleValue.AtLeastKartverket)]
public class AdminController : Controller
{
    private readonly ILogger<AdminController> _logger;
    private readonly DatabaseContext _dbContext;

    public AdminController(ILogger<AdminController> logger, DatabaseContext ctx)
    {
        _logger = logger;
        _dbContext = ctx;
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
            return View("ErrorView", ViewData);
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
        return RedirectToAction("Object", "Report", new { reportId = id, objectId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Comment(Guid id, Guid objectID, string feedbackText, FeedbackType feedbackType)
    {
        if (string.IsNullOrWhiteSpace(feedbackText))
        {
            TempData["Error"] = "Du kan ikke sende blank tilbakemelding";
            return RedirectToAction("Object", "Report", new { reportId = id, objectId = objectID });
        }

        var report = _dbContext.Reports
            .Include(r => r.Feedbacks)
            .ThenInclude(r => r.FeedbackBy)
            .Include(r => r.HindranceObjects)
            .FirstOrDefault(r => r.Id == id);

        if (report == null)
        {
            ModelState.AddModelError("", "Rapprten ble ikke funnet");
            return View("ErrorView");
        }

        var obj = report.HindranceObjects.FirstOrDefault(o => o.Id == objectID);
        if (obj == null)
        {
            ModelState.AddModelError("", "Objektet ble ikke funnet");
            return RedirectToAction("Object", "Report", new { reportId = id, objectId = objectID });
        }

        var ClaimUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(ClaimUserId, out var userId)) return Unauthorized();
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
        return RedirectToAction("Object", "Report", new { reportId = id, objectId = objectID });
    }
}
