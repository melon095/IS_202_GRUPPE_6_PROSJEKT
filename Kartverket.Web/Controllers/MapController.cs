using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map.Request;
using Kartverket.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Controllers;

[Controller]
public class MapController : Controller
{
    private readonly ILogger<MapController> _logger;
    private readonly ReportService _reportService;
    private readonly HindranceService _hindranceService;
    private readonly JourneyOrchestrator _journeyOrchestrator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<UserTable> _userManager;

    public MapController(ILogger<MapController> logger, ReportService reportService, HindranceService hindranceService,
        IUnitOfWork unitOfWork,
        UserManager<UserTable> userManager)
    {
        _logger = logger;
        _reportService = reportService;
        _hindranceService = hindranceService;
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    [HttpGet]
    [Authorize(Policy = RoleValue.AtLeastPilot)]
    public IActionResult Index() => View();

    [HttpPost]
    [Authorize(Policy = RoleValue.AtLeastPilot)]
    public async Task<IActionResult> SyncObject(
        [FromBody] PlacedObjectDataModel body,
        [FromQuery] Guid? journeyId = null,
        [FromServices] CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        try
        {
            var (resultJourneyId, resultObjectId) = await _unitOfWork.ExecuteInTransactionAsync(
                () => _journeyOrchestrator.SyncObject(user.Id, journeyId, body, cancellationToken),
                cancellationToken);

            return Ok(new { JourneyId = resultJourneyId, ObjectId = resultObjectId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing object for user {UserId}", user.Id);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost]
    [Authorize(Policy = RoleValue.AtLeastPilot)]
    public async Task<IActionResult> FinalizeJourney(
        [FromBody] FinalizeJourneyRequest body,
        [FromQuery] Guid? journeyId = null,
        [FromServices] CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (journeyId is null) return BadRequest("JourneyId is required");

        try
        {
            var resultId = await _unitOfWork.ExecuteInTransactionAsync(
                () => _journeyOrchestrator.Finalise(journeyId.Value, body, cancellationToken),
                cancellationToken);

            return Ok(new { JourneyId = resultId });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Journey finalization failed for {JourneyId}", journeyId);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finalizing journey {JourneyId}", journeyId);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetObjects([FromQuery] DateTime? since = null) =>
        Ok(new List<MapObjectsDataModel>());
    // TODO: Cache in memory!
    // var query = _dbContext.MapObjects
    //     .Include(mo => mo.HindranceType)
    //     .Include(mo => mo.MapPoints)
    //     .AsQueryable();
    //
    // if (since != null) query = query.Where(mo => mo.MapPoints.Any(mp => mp.CreatedAt >= since));
    //
    // var mapObjects = await query.ToListAsync();
    //
    // var result = mapObjects.Select(mo => new MapObjectsDataModel
    // {
    //     Id = mo.Id,
    //     TypeId = mo.HindranceType?.Id,
    //     Title = mo.Title,
    //     Points = mo.MapPoints.Select(mp => new MapPointDataModel
    //     {
    //         Lat = mp.Latitude,
    //         Lng = mp.Longitude,
    //         Elevation = mp.Elevation,
    //         CreatedAt = mp.CreatedAt
    //     }).OrderBy(p => p.CreatedAt).ToList()
    // }).ToList();
    //
    // return Ok(result);
}

public class MapObjectsDataModel
{
    public Guid Id { get; set; }
    public Guid? TypeId { get; set; }
    public string? Title { get; set; }
    public List<MapPointDataModel> Points { get; set; } = [];
}

public class MapPointDataModel
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double Elevation { get; set; }
    public DateTime CreatedAt { get; set; }
}
