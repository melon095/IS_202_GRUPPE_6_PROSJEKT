using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Services;
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


    [HttpGet("/report/{id}")]
    public IActionResult Report(string id)
    {
        throw new NotImplementedException();
    }

    [HttpPost("/report")]
    public IActionResult CreateReport([FromBody] object reportData)
    {
        throw new NotImplementedException();
    }

    [HttpGet("/reports")]
    public IActionResult GetAllReports()
    {
        throw new NotImplementedException();
    }

    [HttpDelete("/report/{id}")]
    public IActionResult DeleteReport(string id)
    {
        throw new NotImplementedException();
    }

    [HttpPut("/report/{id}")]
    public IActionResult UpdateReport(string id, [FromBody] object reportData)
    {
        throw new NotImplementedException();
    }
}