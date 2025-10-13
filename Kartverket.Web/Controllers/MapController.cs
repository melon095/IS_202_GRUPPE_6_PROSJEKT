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
using Microsoft.EntityFrameworkCore;

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
        var report = _dbContext.Reports
            .Include(r => r.User)
            .Include(r => r.MapObjects)
            .ThenInclude(mo => mo.MapPoints)
            .FirstOrDefault(r => r.Id == journeyId);
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

            // Filters out duplicates
            // TODO: Cleaner!
            mapObject.MapPoints = obj.Points.Select(p => new MapPointTable
            {
                MapObject = mapObject,
                Latitude = p.Lat,
                Longitude = p.Lng,
                AMSL = p.Elevation,
                CreatedAt = p.CreatedAt
            }).ToList();
            
            var existingPoints = _dbContext.MapPoints
                .Where(mp => mp.MapObjectId == mapObject.Id)
                .ToList();
            var newPoints = mapObject.MapPoints
                .Where(p => !existingPoints.Any(ep => ep.Latitude == p.Latitude && ep.Longitude == p.Longitude && ep.CreatedAt == p.CreatedAt))
                .ToList();
            _dbContext.MapPoints.AddRange(newPoints);
        } 
        
        await _dbContext.SaveChangesAsync();
        
        return Ok(new { JourneyId = report.Id });
    }
}
