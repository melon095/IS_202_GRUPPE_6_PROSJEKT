using Kartverket.Web.AuthPolicy;
using System.Text.Json;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models;
using Kartverket.Web.Models.Map.Request;
using Kartverket.Web.Models.Map.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.EntityFrameworkCore;
using System.Net.Mime;

namespace Kartverket.Web.Controllers;

public class GeoFeature
{
    public string Type { get; set; } = "Feature";
    public Geometry Geometry { get; set; }
    public Properties Properties { get; set; }
}

public class Geometry
{
    public string Type { get; set; } = "Point";
    public object Coordinates { get; set; }
}

public class Properties
{
    public string Description { get; set; }
}

[Controller]
public class MapController : Controller
{
    private readonly ILogger<MapController> _logger;
    private readonly DatabaseContext _dbContext;
    private readonly UserManager<UserTable> _userManager;

    private static readonly JsonSerializerOptions jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public MapController(ILogger<MapController> logger, DatabaseContext dbContext, UserManager<UserTable> userManager)
    {
        _logger = logger;
        _dbContext = dbContext;
        _userManager = userManager;
    }
    
    [HttpGet, Authorize(Policy = RoleValue.AtLeastPilot)]
    public IActionResult Index()
    {
        return View();
    }
    
    // [HttpGet, Authorize]
    // public string GetPoints()
    // {
    //     var geoFeatures = _dbContext.MapPoints
    //         .Include(p => p.MapObject)
    //         .ThenInclude(mo => mo.Report)
    //         .ToList();
    //
    //     var points = geoFeatures.Select(p => new GeoFeature
    //     {
    //         Geometry = new Geometry
    //         {
    //             Coordinates = new [] {p.Longitude, p.Latitude}
    //         },
    //         Properties = new Properties
    //         {
    //             Description = $"{p.Report.Title} - {p.Report.Description}"
    //         }
    //     }).ToList();
    //     
    //     var mapObjects = geoFeatures.GroupBy(p => p.MapObjectId);
    //     foreach (var mapObject in mapObjects)
    //     {
    //         if (mapObject.Count() > 1)
    //         {
    //             var report = mapObject.First().Report;
    //             
    //             points.Add(new GeoFeature
    //             {
    //                 Geometry = new Geometry
    //                 {
    //                     Type = "LineString",
    //                     Coordinates = mapObject.Select(p => new [] {p.Longitude, p.Latitude}).ToList()
    //                 },
    //                 Properties = new Properties
    //                 {
    //                     Description = $"{report.Title} - {report.Description} - (Line)"
    //                 }
    //             });
    //         }
    //     }
    //     
    //     //TODO: Better
    //     var obj = new
    //     {
    //         type = "FeatureCollection",
    //         features = points
    //     };
    //
    //     var geojson = JsonSerializer.Serialize(obj, jsonOpts);
    //     
    //     return geojson;
    // }

    [HttpPost, Authorize(Policy = RoleValue.AtLeastPilot)]
    public async Task<IActionResult> SyncObject(
        [FromBody] PlacedObjectDataModel body,
        [FromQuery] Guid? journeyId = null)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        var user = await _userManager.GetUserAsync(User);
        ArgumentNullException.ThrowIfNull(user, nameof(user));

        var report = _dbContext.Reports
            .Include(r => r.User)
            .FirstOrDefault(r => r.Id == journeyId);
        if (report == null)
        {
            report = new ReportTable
            {
                Id = Guid.NewGuid(),
                Title = $"Midlertidlig rapport - {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                Description = "",
                User = user,
            };
            _dbContext.Reports.Add(report);
        }

        var objectType = _dbContext.MapObjectTypes
            .FirstOrDefault(ot => ot.Name == body.TypeId);
        if (objectType == null)
        {
            objectType = _dbContext.MapObjectTypes.FirstOrDefault();
            _logger.LogWarning("Unknown object type: {TypeId}", body.TypeId);
        }

        var mapObject = new MapObjectTable
        {
            Id = Guid.NewGuid(),
            MapObjectType = objectType!,
            Report = report,
            Title = "",
            Description = ""
        };

        _dbContext.MapObjects.Add(mapObject);
    
        var points = new List<MapPointTable>();
        foreach (var point in body.Points)
        {
            // TODO: Elevation!
            
            points.Add(new MapPointTable
            {
                MapObject = mapObject,
                Latitude = point.Lat,
                Longitude = point.Lng,
                AMSL = 0,
                CreatedAt = point.CreatedAt
            });
        }
        
        mapObject.MapPoints = points;
        _dbContext.MapPoints.AddRange(points);
        await _dbContext.SaveChangesAsync();

        return Ok(new SyncObjectResponse
        {
            JourneyId = report.Id,
            ObjectId = mapObject.Id
        });
    }

    [HttpPost, Authorize(Policy = RoleValue.AtLeastPilot)]
    public async Task<IActionResult> FinalizeJourney(
        [FromBody] FinalizeJourneyRequest body,
        [FromQuery] Guid? journeyId = null)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var user = await _userManager.GetUserAsync(User);
        ArgumentNullException.ThrowIfNull(user, nameof(user));
        var strategy = _dbContext.Database.CreateExecutionStrategy();
        var report = _dbContext.Reports
            .Include(r => r.User)
            .Include(r => r.MapObjects)
            .ThenInclude(mo => mo.MapPoints)
            .FirstOrDefault(r => r.Id == journeyId);
        
        await strategy.ExecuteAsync(async () => 
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                if (report == null)
                {
                    report = new ReportTable
                    {
                        Id = Guid.NewGuid(),
                        Title = body.Journey.Title,
                        Description = body.Journey.Description,
                        User = user,
                    };
                    _dbContext.Reports.Add(report);
                }
        
                report.Title = body.Journey.Title;
                report.Description = body.Journey.Description;
        
                var objectTypeCache = _dbContext.MapObjectTypes.ToDictionary(ot => ot.Id, ot => ot);
                foreach (var obj in body.Objects)
                {
                    // TODO: Custom object types!
                    if (obj.TypeId != null && objectTypeCache.TryGetValue(obj.TypeId.Value, out var objectType))
                    {
                    }
                    else
                    {
                        objectType = objectTypeCache.Values.FirstOrDefault();
                        _logger.LogWarning("Unknown object type: {TypeId}", obj.TypeId);
                    }
            
                    var mapObject = report.MapObjects?.FirstOrDefault(mo => mo.Id == obj.Id);
                    if (mapObject == null)
                    {
                        mapObject = new MapObjectTable
                        {
                            Id = obj.Id,
                            MapObjectType = objectType!,
                            Title = obj.Title,
                            Description = obj.Description
                        };
                        _dbContext.MapObjects.Add(mapObject);
                    }
                    else {
                        mapObject.Title = obj.Title;
                        mapObject.Description = obj.Description;
                    }
            

                    mapObject.Report = report;
                    mapObject.MapObjectType = objectType!;
            
                    var existingPoints = new HashSet<(double Latitude, double Longitude, int AMSL, DateTime CreatedAt)>(
                        mapObject.MapPoints?.Select(p => (p.Latitude, p.Longitude, p.AMSL, p.CreatedAt)) ?? []
                    );

                    foreach (var point in obj.Points)
                    {
                        var pointKey = (point.Lat, point.Lng, point.Elevation, point.CreatedAt);
            
                        if (!existingPoints.Contains(pointKey))
                        {
                            var mapPoint = new MapPointTable
                            {
                                Id = Guid.NewGuid(),
                                Latitude = point.Lat,
                                Longitude = point.Lng,
                                AMSL = point.Elevation,
                                CreatedAt = point.CreatedAt,
                                MapObject = mapObject
                            };
                            _dbContext.MapPoints.Add(mapPoint);
                
                            existingPoints.Add(pointKey);
                        }
                    }
                } 

                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finalizing journey");
                transaction.Rollback();
                throw;
            }
        });
        
        return Ok(new { JourneyId = report.Id });
    }
 
    [HttpGet]
    public async Task<IActionResult> GetObjects([FromQuery] DateTime? since = null)
    {
        // TODO: Cache in memory!
        var query = _dbContext.MapObjects
            .Include(mo => mo.MapObjectType)
            .Include(mo => mo.MapPoints)
            .AsQueryable();
        
        if (since != null)
        {
            query = query.Where(mo => mo.MapPoints.Any(mp => mp.CreatedAt >= since));
        }
        
        var mapObjects = await query.ToListAsync();
        
        var result = mapObjects.Select(mo => new MapObjectsDataModel
        {
            Id = mo.Id,
            TypeId = mo.MapObjectType?.Id,
            Title = mo.Title,
            Points = mo.MapPoints.Select(mp => new MapPointDataModel
            {
                Lat = mp.Latitude,
                Lng = mp.Longitude,
                Elevation = mp.AMSL,
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