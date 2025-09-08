using System.Text.Json;
using Kartverket.Web.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Controllers;

public struct Point
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public Point(double latitude, double longitude)
    {
        Latitude = latitude;
        Longitude = longitude;
    }
}

public class PointData
{
    public Point Point { get; set; }
    public string Description { get; set; }

    public PointData(Point point, string description)
    {
        Point = point;
        Description = description;
    }
}

// public interface IMapService
// {
//     public List<PointData> GetPoints();
// }

public class DummyMapService //: IMapService
{
    private static readonly List<PointData> Points =
    [
        new(new Point(58.15185336588953, 7.964912107168152), "Gumpen"),
        new(new Point(58.14622655382572, 7.992197853227051), "Normal"),
        new(new Point(58.13686167205729, 7.966491810782542), "Henning Olsen")
    ];
    
    public List<PointData> GetPoints() => Points;
    public void Add(PointData point) => Points.Add(point);
}

[Controller]
public class MapController : Controller
{
    private readonly ILogger<MapController> _logger;
    private readonly DummyMapService _mapService;
    
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
            features = points.Select(p => new
            {
                type = "Feature",
                geometry = new
                {
                    type = "Point",
                    coordinates = new[] { p.Point.Longitude, p.Point.Latitude }
                },
                properties = new
                {
                    description = p.Description
                }
            }).ToArray()
        };
        
        var geojson = JsonSerializer.Serialize(obj);
        
        return View(new MapIndexModel(geojson));
    }
    
    [HttpPost]
    public IActionResult AddPoint([FromBody] PointData point)
    {
        _mapService.Add(point);

        return Ok();
    }
}
