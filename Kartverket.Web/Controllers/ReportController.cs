using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Controllers;

public class ReportController : Controller
{
    private readonly ILogger<ReportController> _logger;
    private readonly DatabaseContext _dbContext;
    
    public ReportController(ILogger<ReportController> logger, DatabaseContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    // [HttpPost, Authorize(Policy = RoleValue.AtLeastPilot)]
    // public Guid PilotCreate()
    // {
    //     var date = DateTime.UtcNow;
    //     var user = User.Identity?.Name ?? "unknown";
    //     var userId = _dbContext.Users.FirstOrDefault(u => u.UserName == user)?.Id;
    //     ArgumentNullException.ThrowIfNull(userId, nameof(userId));
    //     
    //     var report = new ReportTable()
    //     {
    //         Id = Guid.NewGuid(),
    //         Title = $"Midlertidlig rapport - {date:yyyy-MM-dd HH:mm}",
    //         Description = "",
    //         UserId = userId.Value,
    //     };
    //     
    //     _dbContext.Reports.Add(report);
    //     _dbContext.SaveChanges();
    //
    //     return report.Id;
    // }
}
