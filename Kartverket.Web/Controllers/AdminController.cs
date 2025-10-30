using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Admin;
using Kartverket.Web.Models.Admin.Request;
using Kartverket.Web.Models.Report.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

[Controller]
public class AdminController : Controller
{
    private readonly ILogger<AdminController> _logger;
    private readonly UserManager<UserTable> _userManager;
    private readonly RoleManager<RoleTable> _roleManager;
    private readonly DatabaseContext _dbContext;
    private const int ReportPerPage = 10;

    public AdminController(
        ILogger<AdminController> logger,
        UserManager<UserTable> userManager,
        RoleManager<RoleTable> roleManager,
        DatabaseContext ctx)
    {
        _logger = logger;
        _userManager = userManager;
        _roleManager = roleManager;
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
                TotalObjects = report.HindranceObjects.Count
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
                Description = objects.Description
            };
            foreach (var point in objects.HindrancePoints)
                objectData.Points.Add(new InDepthReportModel.ObjectDataModel.Point
                {
                    Lat = point.Latitude,
                    Lng = point.Longitude,
                    Elevation = point.Elevation
                });

            if (objectData.Points.Count > 0)
            {
                var GetCentroid = new InDepthReportModel.ObjectDataModel.Point
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

    [HttpGet("/Admin/Users")]
    [Authorize(Policy = RoleValue.AtLeastKartverket)]
    [ImportModelState]
    public IActionResult Users()
    {
        var roles = _roleManager.Roles
            .Select(r => new AdminUserViewModel.RoleDto(r.Id, r.Name))
            .ToList();

        var users = _userManager.Users
            .Include(u => u.Role)
            .Select(u => new AdminUserViewModel.UserDto(
                u.Id,
                u.UserName,
                u.Role == null
                    ? null
                    : new AdminUserViewModel.RoleDto(u.Role.Id, u.Role.Name)))
            .ToList();

        var model = new AdminUserViewModel
        {
            Roles = roles,
            Users = users
        };

        return View(model);
    }

    [HttpDelete]
    [Authorize(Policy = RoleValue.AtLeastKartverket)]
    [ExportModelState]
    public async Task<IActionResult> Users(Guid userId)
    {
        ModelState.AddModelError("test", "test2");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            ModelState.AddModelError("UserNotFound", "Brukeren ble ikke funnet.");
            return RedirectToAction("Users");
        }

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            ModelState.AddModelError("UserDeleteFailed", "Kunne ikke slette brukeren.");

        return RedirectToAction("Users");
    }

    [HttpPatch("/Admin/Users/Role")]
    [Authorize(Policy = RoleValue.AtLeastKartverket)]
    [ExportModelState]
    public async Task<IActionResult> Role(AdminUpdateUserRoleRequest request)
    {
        ModelState.AddModelError("test", "test2");
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null)
        {
            ModelState.AddModelError("UserNotFound", "Brukeren ble ikke funnet.");
            return RedirectToAction("Users");
        }

        var role = await _dbContext.Roles.FindAsync(request.RoleId);
        if (role is null)
        {
            ModelState.AddModelError("RoleNotFound", "Rollen ble ikke funnet.");
            return RedirectToAction("Users");
        }

        user.RoleId = role.Id;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            ModelState.AddModelError("UserRoleUpdateFailed", "Kunne ikke oppdatere brukerens rolle.");

        return RedirectToAction("Users");
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
