using System.Text.Json;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models;
using Kartverket.Web.Models.Map.Request;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        var points = _dbContext.MapPoints
            .Select(p => new GeoFeature
            {
                Geometry = new Geometry
                {
                    Coordinates = new [] {p.Longitude, p.Latitude}
                },
                Properties = new Properties
                {
                    Description = $"{p.MapObject.Name} - {p.Report.Description}"
                }
            }).ToList();

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
            return BadRequest(ModelState);

        var objectType = _dbContext.MapObjectTypes.FirstOrDefault();
        var report = _dbContext.Reports.FirstOrDefault(r => r.Id == body.ReportId);
        if (objectType == null || report == null)
            return BadRequest("Invalid report ID or missing map object type.");
        
        var mapObject = new MapObjectTable
        {
            Name = "Map Object",
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
                AMSL = point.Eleveation
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
                Description = $"{mapObject.Name} - {p.Report.Description}"
            }
        }).ToList();

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