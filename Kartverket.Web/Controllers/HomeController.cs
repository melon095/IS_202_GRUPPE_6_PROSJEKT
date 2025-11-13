using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace Kartverket.Web.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index() => View();

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => View(new ErrorViewModel
        { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });

    [Authorize]
    public async Task<IActionResult> DebugFillDatabase(
        [FromServices] DatabaseContext dbContext,
        [FromServices] UserManager<UserTable> userManager,
        CancellationToken cancellationToken = default)
    {
        const int ITERATIONS = 100;
        const double SIZE = 0.1;

        // Leftmost = 58.069402, 7.428365
        // Rightmost = 58.307080, 8.435572

        var user = await userManager.GetUserAsync(User);

        var hindranceTypes = dbContext.HindranceTypes.ToList();
        var report = new ReportTable
        {
            Id = Guid.NewGuid(),
            Title = "Debug Fill Report",
            Description = "This report was created to fill the database with test data.",
            ReviewStatus = ReviewStatus.Draft,
            ReportedById = user.Id
        };

        List<HindranceObjectTable> hindranceObjects = new();
        List<HindrancePointTable> hindrancePoints = new();
        Random random = new();
        for (var i = 0; i < ITERATIONS; i++)
        {
            var lat = 58.069402 + random.NextDouble() * (58.307080 - 58.069402);
            var lon = 7.428365 + random.NextDouble() * (8.435572 - 7.428365);
            HindranceObjectTable hindranceObject = new()
            {
                Title = $"Hindrance {i + 1}",
                Description = "This is a randomly generated hindrance object for testing purposes.",
                Report = report
            };
            hindranceObjects.Add(hindranceObject);

            var pointType = random.Next(1, 4);
            if (pointType == 1)
            {
                HindrancePointTable hindrancePoint = new()
                {
                    HindranceObject = hindranceObject,
                    Latitude = lat,
                    Longitude = lon,
                    Label = ""
                };
                hindrancePoints.Add(hindrancePoint);
                hindranceObject.GeometryType = GeometryType.Point;
                hindranceObject.HindranceTypeId = hindranceTypes.First(ht =>
                    ht.GeometryType == GeometryType.Point && ht.Name == HindranceTypeTable.DEFAULT_TYPE_NAME).Id;
            }
            else if (pointType == 2)
            {
                HindrancePointTable hindrancePoint1 = new()
                {
                    HindranceObject = hindranceObject,
                    Latitude = lat,
                    Longitude = lon,
                    Label = ""
                };
                HindrancePointTable hindrancePoint2 = new()
                {
                    HindranceObject = hindranceObject,
                    Latitude = lat + random.NextDouble() * SIZE,
                    Longitude = lon + random.NextDouble() * SIZE,
                    Label = ""
                };
                hindrancePoints.Add(hindrancePoint1);
                hindrancePoints.Add(hindrancePoint2);
                hindranceObject.GeometryType = GeometryType.Line;
                hindranceObject.HindranceTypeId = hindranceTypes.First(ht =>
                    ht.GeometryType == GeometryType.Line && ht.Name == HindranceTypeTable.DEFAULT_TYPE_NAME).Id;
            }
            else
            {
                HindrancePointTable hindrancePoint1 = new()
                {
                    HindranceObject = hindranceObject,
                    Latitude = lat,
                    Longitude = lon,
                    Label = ""
                };
                HindrancePointTable hindrancePoint2 = new()
                {
                    HindranceObject = hindranceObject,
                    Latitude = lat + random.NextDouble() * SIZE,
                    Longitude = lon + random.NextDouble() * SIZE,
                    Label = ""
                };
                HindrancePointTable hindrancePoint3 = new()
                {
                    HindranceObject = hindranceObject,
                    Latitude = lat + random.NextDouble() * SIZE,
                    Longitude = lon + random.NextDouble() * SIZE,
                    Label = ""
                };
                hindrancePoints.Add(hindrancePoint1);
                hindrancePoints.Add(hindrancePoint2);
                hindrancePoints.Add(hindrancePoint3);
                hindranceObject.GeometryType = GeometryType.Area;
                hindranceObject.HindranceTypeId = hindranceTypes.First(ht =>
                    ht.GeometryType == GeometryType.Area && ht.Name == HindranceTypeTable.DEFAULT_TYPE_NAME).Id;
            }
        }

        dbContext.HindranceObjects.AddRange(hindranceObjects);
        dbContext.HindrancePoints.AddRange(hindrancePoints);
        return await dbContext.SaveChangesAsync(cancellationToken)
            .ContinueWith<IActionResult>(_ => RedirectToAction("Index"), cancellationToken);
    }
}
