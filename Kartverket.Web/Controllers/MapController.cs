using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map;
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
    private readonly IHindranceService _hindranceService;
    private readonly IJourneyOrchestrator _journeyOrchestrator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<UserTable> _userManager;

    public MapController(
        ILogger<MapController> logger,
        IHindranceService hindranceService,
        IJourneyOrchestrator journeyOrchestrator,
        IUnitOfWork unitOfWork,
        UserManager<UserTable> userManager)
    {
        _logger = logger;
        _hindranceService = hindranceService;
        _journeyOrchestrator = journeyOrchestrator;
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    [HttpGet]
    [Authorize]
    public IActionResult Index() => View();

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> SyncHindrance(
        [FromBody] PlacedHindranceDataModel body,
        [FromQuery] Guid? journeyId = null,
        [FromServices] CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        try
        {
            var (resultJourneyId, resultHindranceId) = await _unitOfWork.ExecuteInTransactionAsync(
                () => _journeyOrchestrator.SyncHindrance(user.Id, journeyId, body, cancellationToken),
                cancellationToken);

            return Ok(new { JourneyId = resultJourneyId, HindranceId = resultHindranceId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing hindrance for user {UserId}", user.Id);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost]
    [Authorize]
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
    [Authorize]
    public async Task<MapHindrancesDataModel[]> GetHindrances(
        [FromQuery] DateTime? since = null,
        [FromQuery] Guid? reportId = null,
        [FromServices] CancellationToken cancellationToken = default)
    {
        var mapHindrances = await _hindranceService.GetAllHindrancesSince(since, reportId, cancellationToken);

        return mapHindrances.Select(mo => new MapHindrancesDataModel
        {
            Id = mo.Id,
            ReportId = mo.ReportId,
            TypeId = mo.HindranceTypeId,
            GeometryType = mo.GeometryType,
            Title = mo.Title,
            Points = mo.HindrancePoints
                .OrderBy(o => o.Order)
                .Select(mp => new MapPointDataModel
                {
                    Lat = mp.Latitude,
                    Lng = mp.Longitude,
                    Elevation = mp.Elevation,
                    CreatedAt = mp.CreatedAt
                })
                .ToArray()
        }).ToArray();
    }
}
