using System.Text.Json;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models;
using Kartverket.Web.Models.Map.Request;
using Microsoft.AspNetCore.Authorization;
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

    private static readonly JsonSerializerOptions jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public MapController(ILogger<MapController> logger, DatabaseContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    [HttpGet, Authorize]
    public IActionResult Index()
    {
        var geoFeatures = _dbContext.MapPoints
            .Include(p => p.MapObject)
            .Include(p => p.Report)
            .ToList();

        var points = geoFeatures.Select(p => new GeoFeature
        {
            Geometry = new Geometry
            {
                Coordinates = new [] {p.Longitude, p.Latitude}
            },
            Properties = new Properties
            {
                Description = $"{p.Report.Title} - {p.Report.Description}"
            }
        }).ToList();
        
        var mapObjects = geoFeatures.GroupBy(p => p.MapObjectId);
        foreach (var mapObject in mapObjects)
        {
            if (mapObject.Count() > 1)
            {
                var report = mapObject.First().Report;
                
                points.Add(new GeoFeature
                {
                    Geometry = new Geometry
                    {
                        Type = "LineString",
                        Coordinates = mapObject.Select(p => new [] {p.Longitude, p.Latitude}).ToList()
                    },
                    Properties = new Properties
                    {
                        Description = $"{report.Title} - {report.Description} - (Line)"
                    }
                });
            }
        }
        
        //TODO: Better
        var obj = new
        {
            type = "FeatureCollection",
            features = points
        };

        var geojson = JsonSerializer.Serialize(obj, jsonOpts);

        return View(new MapIndexModel(geojson));
    }

    [HttpPost, Authorize]
    public IActionResult Upload([FromBody] UploadMapDataModel body)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .Select(x => new { x.Key, Errors = x.Value?.Errors.Select(e => e.ErrorMessage) });
            
            return BadRequest(new { Errors = errors });
        }

        var user = User.Identity?.Name ?? "unknown";
        var userId = _dbContext.Users.FirstOrDefault(u => u.UserName == user)?.Id;
        ArgumentNullException.ThrowIfNull(userId, nameof(userId));

        var report = new ReportTable
        {
            Title = body.ReportTitle,
            Description = body.ReportDescription,
            UserId = userId.Value
        };
        _dbContext.Reports.Add(report);

        var objectType = _dbContext.MapObjectTypes.FirstOrDefault();
        var mapObject = new MapObjectTable
        {
            MapObjectTypeId = objectType.Id
        };
        
        var points = new List<MapPointTable>();
        foreach (var point in body.Points)
        {
            points.Add(new MapPointTable
            {
                MapObject = mapObject,
                Report = report,
                Latitude = point.Lat,
                Longitude = point.Lng,
                AMSL = point.Elevation
            });
        }

        mapObject.MapPoints = points;
        _dbContext.MapObjects.Add(mapObject);
        _dbContext.MapPoints.AddRange(points);
        _dbContext.SaveChanges();

        var geoFeatures = points.Select(p => new GeoFeature
        {
            Geometry = new Geometry
            {
                Coordinates = new [] {p.Longitude, p.Latitude}
            },
            Properties = new Properties
            {
                Description = $"{report.Title} - {p.Report.Description}"
            }
        }).ToList();
        
        if (points.Count > 1)
        {
            geoFeatures.Add(new GeoFeature
            {
                Geometry = new Geometry
                {
                    Type = "LineString",
                    Coordinates = points.Select(p => new [] {p.Longitude, p.Latitude}).ToList()
                },
                Properties = new Properties
                {
                    Description = $"{report.Title} - {report.Description} (Line)"
                }
            });
        }

        var obj = new
        {
            type = "FeatureCollection",
            features = geoFeatures
        };
        
        var geojson = JsonSerializer.Serialize(obj, jsonOpts);
        
        return Ok(geojson);
    }
}

public record MapAddPointModel(Guid ReportId, double Latitude, double Longitude);

public record MapAddLineModel(Guid ReportId, List<MapAddPointModel> Points);

public record UpdateReportModel(string ReportDescription);