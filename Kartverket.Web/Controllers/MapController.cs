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
        ArgumentNullException.ThrowIfNull(user, nameof(user));

        var draftReport = await _reportService.GetDraft(journeyId ?? Guid.Empty, cancellationToken);
        draftReport ??= await _reportService.CreateDraft(user.Id, cancellationToken);

        var hindranceType = await _hindranceService.GetHindranceTypeById(body.TypeId, cancellationToken);
        var mapObjectDraft =
            await _hindranceService.CreateHindranceObjectDraft(draftReport.Id, hindranceType.Id, cancellationToken);
        var mapPoints = await _hindranceService.AddHindrancePoints(mapObjectDraft.Id, body.Points, cancellationToken);
        await _hindranceService.LinkHindranceObjectToReport(draftReport.Id, mapObjectDraft.Id, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { JourneyId = draftReport.Id, ObjectId = mapObjectDraft.Id });
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

        var user = await _userManager.GetUserAsync(User);
        ArgumentNullException.ThrowIfNull(user, nameof(user));
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            {
                var report = await _reportService.GetDraft(journeyId.Value, cancellationToken);
            }
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finalizing journey");
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
        //
        // var strategy = _dbContext.Database.CreateExecutionStrategy();
        // var report = _dbContext.Reports
        //     .Include(r => r.ReportedBy)
        //     .Include(r => r.MapObjects)
        //     .ThenInclude(mo => mo.MapPoints)
        //     .FirstOrDefault(r => r.Id == journeyId);
        //
        // await strategy.ExecuteAsync(async () =>
        // {
        //     await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        //     try
        //     {
        //         if (report == null)
        //         {
        //             report = new ReportTable
        //             {
        //                 Id = Guid.NewGuid(),
        //                 Title = body.Journey.Title,
        //                 Description = body.Journey.Description,
        //                 ReportedBy = user,
        //                 Status = FeedbackStatus.Draft
        //             };
        //             _dbContext.Reports.Add(report);
        //         }
        //
        //         report.Title = body.Journey.Title;
        //         report.Description = body.Journey.Description;
        //
        //         var objectTypeCache = _dbContext.MapObjectTypes.ToDictionary(ot => ot.Id, ot => ot);
        //         foreach (var obj in body.Objects)
        //         {
        //             if (obj.Deleted) _logger.LogWarning("DELETED er ikke implementert!");
        //
        //             // TODO: Custom object types!
        //             if (obj.TypeId != null && objectTypeCache.TryGetValue(obj.TypeId.Value, out var objectType))
        //             {
        //             }
        //             else
        //             {
        //                 objectType = objectTypeCache.Values.FirstOrDefault();
        //                 _logger.LogWarning("Unknown object type: {TypeId}", obj.TypeId);
        //             }
        //
        //             var mapObject = report.MapObjects?.FirstOrDefault(mo => mo.Id == obj.Id);
        //             if (mapObject == null)
        //             {
        //                 mapObject = new HindranceObjectTable
        //                 {
        //                     Id = obj.Id,
        //                     HindranceType = objectType!,
        //                     Title = obj.Title,
        //                     Description = obj.Description
        //                 };
        //                 _dbContext.MapObjects.Add(mapObject);
        //             }
        //             else
        //             {
        //                 mapObject.Title = obj.Title;
        //                 mapObject.Description = obj.Description;
        //             }
        //
        //
        //             mapObject.Report = report;
        //             mapObject.HindranceType = objectType!;
        //
        //             var existingPoints = new HashSet<(double Latitude, double Longitude, int AMSL, DateTime CreatedAt)>(
        //                 mapObject.MapPoints?.Select(p => (p.Latitude, p.Longitude, AMSL: p.Elevation, p.CreatedAt)) ??
        //                 []
        //             );
        //
        //             foreach (var point in obj.Points)
        //             {
        //                 var pointKey = (point.Lat, point.Lng, point.Elevation, point.CreatedAt);
        //
        //                 if (!existingPoints.Contains(pointKey))
        //                 {
        //                     var mapPoint = new HindrancePointTable
        //                     {
        //                         Id = Guid.NewGuid(),
        //                         Latitude = point.Lat,
        //                         Longitude = point.Lng,
        //                         Elevation = point.Elevation,
        //                         CreatedAt = point.CreatedAt,
        //                         HindranceObject = mapObject
        //                     };
        //                     _dbContext.MapPoints.Add(mapPoint);
        //
        //                     existingPoints.Add(pointKey);
        //                 }
        //             }
        //         }
        //
        //         await transaction.CommitAsync();
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError(ex, "Error finalizing journey");
        //         transaction.Rollback();
        //         throw;
        //     }
        // });

        return Ok(new { JourneyId = report.Id });
    }

    [HttpGet]
    public async Task<IActionResult> GetObjects([FromQuery] DateTime? since = null)
    {
        // TODO: Cache in memory!
        var query = _dbContext.MapObjects
            .Include(mo => mo.HindranceType)
            .Include(mo => mo.MapPoints)
            .AsQueryable();

        if (since != null) query = query.Where(mo => mo.MapPoints.Any(mp => mp.CreatedAt >= since));

        var mapObjects = await query.ToListAsync();

        var result = mapObjects.Select(mo => new MapObjectsDataModel
        {
            Id = mo.Id,
            TypeId = mo.HindranceType?.Id,
            Title = mo.Title,
            Points = mo.MapPoints.Select(mp => new MapPointDataModel
            {
                Lat = mp.Latitude,
                Lng = mp.Longitude,
                Elevation = mp.Elevation,
                CreatedAt = mp.CreatedAt
            }).OrderBy(p => p.CreatedAt).ToList()
        }).ToList();

        return Ok(result);
    }
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
