using System;
using Kartverket.Web.Database;
using Kartverket.Web.Models;
using Kartverket.Web.Models.Report.Response;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    [HttpGet("/Admin/ReportInDepth/{id:guid}")]
    public IActionResult ReportInDepth(Guid id)
    {
        var Model = new InDepthReportModel();
        var report = _context.Reports
            .Include(r => r.User)
            .Include(r => r.MapPoints)
            .FirstOrDefault(r => r.Id == id);
        foreach (var point in report.MapPoints)
        {
            Model.Points.Add(new InDepthReportModel.Point
                {
                Lat = point.Latitude,
                Lng = point.Longitude,
                //Elevation = point.ASML
            });
        }
        Model.Id = report.Id;
        Model.Title = report.Title;
        Model.Description = report.Description;
        Model.CreatedAt = report.CreatedAt;
        if (report == null)
        {
            return NotFound();
        }
        return View(Model);
    }

    public IActionResult Index()
    {
        var reports = _context.Reports.ToList();
        var Model = new GetAllReportsModel();
        foreach(var report in reports)
        {
            Model.Reports.Add(new MakeReportList
            {
                Id = report.Id,
                CreatedAt = report.CreatedAt,
                Title = report.Title
            });
        }
        return View(Model);
    }
}