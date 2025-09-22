using System.Text.Json;
using Kartverket.Web.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Controllers;

public class Role
{
    public Guid ID { get; set; } = Guid.NewGuid();
    public string RoleName { get; set; }
}

public class User
{
    public Guid ID { get; set; } = Guid.NewGuid();
    public string UserName { get; set; }
    public Role Role { get; set; }
}

public class Report
{
    public Guid ID { get; set; } = Guid.NewGuid();
    public string ReportDescription { get; set; }
    public List<ReportFeedback> Feedbacks { get; set; } = new();
}

public class ReportFeedback
{
    public Guid ID { get; set; } = Guid.NewGuid();
    public Report Report { get; set; }
    public string Feedback { get; set; }
}

public class ReportFeedbackAssignment
{
    public Guid ID { get; set; } = Guid.NewGuid();
    public ReportFeedback Feedback { get; set; }
    public User AssignedTo { get; set; }
}

public class MapObject
{
    public Guid ID { get; set; } = Guid.NewGuid();
    public string Name { get; set; }
}

public class MapPoint
{
    public Guid ID { get; set; } = Guid.NewGuid();
    public Report Report { get; set; }
    public MapObject MapObject { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int AMSL { get; set; }
}

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

public class DummyMapService
{
    private static readonly List<MapPoint> MapPoints = new();
    private static readonly List<Report> Reports = new();

    public GeoFeature ConvertPoint(MapPoint point)
    {
        return new GeoFeature
        {
            Geometry = new Geometry
            {
                Coordinates = new [] {point.Longitude, point.Latitude}
            },
            Properties = new Properties
            {
                Description = $"{point.MapObject.Name} - {point.Report.ReportDescription}"
            }
        };
    }
    
    public List<GeoFeature> GetPoints()
    {
        var points = MapPoints.Select(ConvertPoint).ToList();
        
        var lines = MapPoints
            .GroupBy(p => p.Report.ID)
            .Where(g => g.Count() > 1)
            .Select(g => new GeoFeature
            {
                Geometry = new Geometry
                {
                    Type = "LineString",
                    Coordinates = g.Select(p => new [] {p.Longitude, p.Latitude}).ToArray()
                },
                Properties = new Properties
                {
                    Description = $"{g.First().MapObject.Name} - {g.First().Report.ReportDescription} (Line)"
                }
            }).ToList();

        
        foreach (var line in lines)
        {
            if (line.Geometry.Coordinates is not object[] coords || coords.Length == 0) continue;
            
            var firstPoint = coords[0];
            var coordList = coords.ToList();
            coordList.Add(firstPoint);
            line.Geometry.Coordinates = coordList.ToArray();
        }
        
        points.AddRange(lines);
        
        return points;
    }
    
    public DummyMapService()
    {
        Seed();
    }

    public void AddMapPoint(MapPoint point)
    {
        MapPoints.Add(point);
    }
    
    public Report CreateReport(string description)
    {
        var report = new Report
        {
            ID = Guid.NewGuid(),
            ReportDescription = description,
            Feedbacks = []
        };
        
        Reports.Add(report);

        return report;
    }
    
    public Report? GetReport(Guid id)
    {
        return Reports.FirstOrDefault(r => r.ID == id);
    }
    
    private void Seed()
    {
        var report = new Report
        {
            ReportDescription = "This is a test report"
        };
        
        var mapObject = new MapObject
        {
            Name = "Test Object"
        };
        
        var mapPoint1 = new MapPoint
        {
            Report = report,
            MapObject = mapObject,
            Latitude = 58.15185336588953,
            Longitude = 7.964912107168152,
            AMSL = 100
        };
        
        var mapPoint2 = new MapPoint
        {
            Report = report,
            MapObject = mapObject,
            Latitude = 58.14622655382572,
            Longitude = 7.992197853227051,
            AMSL = 150
        };
        
        var mapPoint3 = new MapPoint
        {
            Report = report,
            MapObject = mapObject,
            Latitude = 58.13686167205729,
            Longitude = 7.966491810782542,
            AMSL = 200
        };
        
        MapPoints.Add(mapPoint1);
        MapPoints.Add(mapPoint2);
        MapPoints.Add(mapPoint3);

        var report2 = new Report
        {
            ReportDescription = "UIA"
        };
        
        var object2 = new MapObject
        {
            Name = "UIA"
        };
        
        MapPoints.Add(new MapPoint
        {
            Report = report2,
            MapObject = object2,
            Latitude = 58.163506966943,
            Longitude = 8.003574115715637,
            AMSL = 50
        });
        
        MapPoints.Add(new MapPoint 
        {
            Report = report2,
            MapObject = object2,
            Latitude = 58.16363482369643,
            Longitude = 7.999913653696864,
            AMSL = 75
        });
        
        MapPoints.Add(new MapPoint 
        {
            Report = report2,
            MapObject = object2,
            Latitude = 58.163772902987205,
            Longitude = 8.002266061424608,
            AMSL = 75
        });
    }
}

[Controller]
public class MapController : Controller
{
    private readonly ILogger<MapController> _logger;
    private readonly DummyMapService _mapService;
    
    private static readonly JsonSerializerOptions jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };
    
    public MapController(ILogger<MapController> logger, DummyMapService mapService)
    {
        _logger = logger;
        _mapService = mapService;
    }
    
    public IActionResult Index()
    {
        var points = _mapService.GetPoints();
        //TODO: Better
        var obj = new
        {
            type = "FeatureCollection",
            features = points
        };
        
        var geojson = JsonSerializer.Serialize(obj, jsonOpts);
        
        return View(new MapIndexModel(geojson));
    }

    // [HttpPost]
    // public string AddPoint([FromBody] MapAddPointModel point)
    // {
    //     _logger.LogInformation("Received point: {Latitude}, {Longitude}", point.Latitude, point.Longitude);
    //     var report = _mapService.GetReport(point.ReportId);
    //     if (report == null)
    //     {
    //         Response.StatusCode = 400;
    //         return JsonSerializer.Serialize(new {error = "Invalid report ID"}, jsonOpts);
    //     }
    //     
    //     var mapObject = new MapObject
    //     {
    //         ID = Guid.NewGuid(),
    //         Name = "New Object"
    //     };
    //     
    //     var mapPoint = new MapPoint
    //     {
    //         Report = report,
    //         MapObject = mapObject,
    //         Latitude = point.Latitude,
    //         Longitude = point.Longitude,
    //         AMSL = 0
    //     };
    //     
    //     _mapService.AddMapPoint(mapPoint);
    //     
    //     return JsonSerializer.Serialize(_mapService.ConvertPoint(mapPoint), jsonOpts);
    // }
    //
    // [HttpPost]
    // public string AddLines([FromBody] MapAddLineModel line)
    // {
    //     _logger.LogInformation("Received lines {@Points}", line.Points);
    //     var report = _mapService.GetReport(line.ReportId);
    //     if (report == null)
    //     {
    //         Response.StatusCode = 400;
    //         return JsonSerializer.Serialize(new {error = "Invalid report ID"}, jsonOpts);
    //     }
    //
    //     var mapObject = new MapObject
    //     {
    //         ID = Guid.NewGuid(),
    //         Name = "New Line Object"
    //     };
    //     
    //     var mapPoints = line.Points.Select(p => new MapPoint
    //     {
    //         Report = report,
    //         MapObject = mapObject,
    //         Latitude = p.Latitude,
    //         Longitude = p.Longitude,
    //         AMSL = 0
    //     }).ToList();
    //     
    //     foreach(var point in mapPoints)
    //         _mapService.AddMapPoint(point);
    //
    //     var geoFeature = new GeoFeature
    //     {
    //         Geometry = new Geometry
    //         {
    //             Type = "LineString",
    //             Coordinates = mapPoints.Select(p => new [] {p.Longitude, p.Latitude}).ToArray()
    //         },
    //         Properties = new Properties
    //         {
    //             Description = $"{mapObject.Name} - {report.ReportDescription} (Line)"
    //         }
    //     };
    //     
    //     return JsonSerializer.Serialize(geoFeature, jsonOpts);
    // }
    //
    // [HttpPost]
    // public Report? CreateReport()
    // {
    //     if (!ModelState.IsValid)
    //     {
    //         Response.StatusCode = 400;
    //         return null;
    //     }
    //     
    //     return _mapService.CreateReport("Pending Description");
    // }
    //
    // [HttpPut]
    // public Report? UpdateReport(Guid id, [FromBody] UpdateReportModel model)
    // {
    //     if (!ModelState.IsValid)
    //     {
    //         Response.StatusCode = 400;
    //         return null;
    //     }
    //
    //     var report = _mapService.GetReport(id);
    //     if (report == null)
    //     {
    //         Response.StatusCode = 404;
    //         return null;
    //     }
    //
    //     report.ReportDescription = model.ReportDescription;
    //     return report;
    // }
}

public record MapAddPointModel(Guid ReportId, double Latitude, double Longitude);

public record MapAddLineModel(Guid ReportId, List<MapAddPointModel> Points);

public record UpdateReportModel(string ReportDescription);