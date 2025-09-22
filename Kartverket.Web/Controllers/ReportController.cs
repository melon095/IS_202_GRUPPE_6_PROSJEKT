using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Report.Request;
using Kartverket.Web.Services;
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

    [HttpGet]
    public IActionResult Report(string id)
    {
        throw new NotImplementedException();
    }

    [HttpPost, Authorize]
    public IActionResult Create([FromBody] CreateReportRequestModel reportRequestData)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
            
        var user = User.Identity?.Name ?? "unknown";
        var userId = _dbContext.Users.FirstOrDefault(u => u.UserName == user)?.Id;
        ArgumentNullException.ThrowIfNull(userId, nameof(userId));

        var report = new ReportTable
        {
            Title = reportRequestData.Title,
            Description = reportRequestData.Description,
            UserId = userId.Value
        };
        _dbContext.Reports.Add(report);
        _dbContext.SaveChanges();
        
        return Ok(report);
    }

    [HttpGet("/reports")]
    public IActionResult GetAll()
    {
        throw new NotImplementedException();
    }

    [HttpDelete("/{id}")]
    public IActionResult Delete(string id)
    {
        throw new NotImplementedException();
    }

    [HttpPut("/{id}")]
    public IActionResult Update(string id, [FromBody] object reportData)
    {
        throw new NotImplementedException();
    }
}
