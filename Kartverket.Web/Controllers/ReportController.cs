using Kartverket.Web.Database;
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
