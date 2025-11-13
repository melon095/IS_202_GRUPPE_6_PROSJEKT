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
    private readonly IHttpClientFactory _httpClientFactory;

    public MapController(
        ILogger<MapController> logger,
        IHindranceService hindranceService,
        IJourneyOrchestrator journeyOrchestrator,
        IUnitOfWork unitOfWork,
        UserManager<UserTable> userManager,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _hindranceService = hindranceService;
        _journeyOrchestrator = journeyOrchestrator;
        _unitOfWork = unitOfWork;
        _userManager = userManager;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    [Authorize]
    public IActionResult Index() => View();

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> SyncObject(
        [FromBody] PlacedObjectDataModel body,
        [FromQuery] Guid? journeyId = null,
        CancellationToken cancellationToken = default)
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
    [Authorize]
    public async Task<IActionResult> FinalizeJourney(
        [FromBody] FinalizeJourneyRequest body,
        [FromQuery] Guid? journeyId = null,
        CancellationToken cancellationToken = default)
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
    public async Task<IEnumerable<MapObjectDataModel>> GetObjects(
        [FromQuery] DateTime? since = null,
        [FromQuery] Guid? reportId = null,
        CancellationToken cancellationToken = default) =>
        await _hindranceService.GetAllObjectsSince(since, reportId, cancellationToken);

    [HttpGet("/Map/SatelliteTiles/{z:int}/{x:int}/{y:int}.jpg")]
    [Authorize]
    public async Task<IActionResult> SatelliteTiles(int x, int y, int z,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = _httpClientFactory.CreateClient("StadiaTiles");

            var response = await client.GetAsync($"/tiles/alidade_satellite/{z}/{x}/{y}.jpg", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Failed to fetch satellite tile {Z}/{X}/{Y}: {StatusCode} {ResponseBody}",
                    z, x, y, response.StatusCode, responseBody);

                return NotFound();
            }

            var stream = await response.Content.ReadAsStreamAsync(cancellationToken);

            HttpContext.Response.Headers.ETag = response.Headers.ETag?.Tag ?? null;
            HttpContext.Response.Headers.LastModified = response.Content.Headers.LastModified?.ToString() ?? null;
            HttpContext.Response.Headers.CacheControl =
                response.Headers.CacheControl?.ToString() ?? "public,max-age=3600";

            return File(stream, "image/jpeg");
        }
        catch
        {
            return NotFound();
        }
    }
}
