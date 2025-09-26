using Kartverket.Web.Database;
using Kartverket.Web.Models;
using Microsoft.AspNetCore.Mvc;
using static Kartverket.Web.Models.GetAllReportsModel;

namespace Kartverket.Web.Controllers;

[Controller]
public class AdminController: Controller
{
    private readonly ILogger<AdminController> _logger;
    private readonly DatabaseContext _context;

    public AdminController(ILogger<AdminController> logger, DatabaseContext context)
    {
        _logger = logger;
        _context = context;
    }

    public ActionResult ReportInDepth()
    {
        return View();
    }

    public IActionResult Index()
    {
        var reports = _context.Reports.ToList();
        var Model = new GetAllReportsModel();
        foreach(var report in reports)
        {
            Model.Reports.Add(new MakeReportList
            {
                CreatedAt = report.CreatedAt,
                Title = report.Title
            });
        }
        return View(Model);
    }
}