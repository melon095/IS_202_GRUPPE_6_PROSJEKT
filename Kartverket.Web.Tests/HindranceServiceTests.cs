using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map.Request;
using Kartverket.Web.Services;
using Microsoft.Extensions.Logging;

namespace Kartverket.Web.Tests;

public class HindranceServiceTests
{
    private readonly ILogger<HindranceService> _logger;
    private readonly DatabaseContext _dbContext;
    private readonly IHindranceService _hindranceService;

    public HindranceServiceTests()
    {
        _logger = Substitute.For<ILogger<HindranceService>>();
        _dbContext = Create.MockedDbContextFor<DatabaseContext>();
        _hindranceService = new HindranceService(_logger, _dbContext);
    }

    [Fact]
    public async Task CreateObject_ShouldCreateHindranceObject()
    {
        // Arrange
        var reportId = Guid.NewGuid();
        var hindranceTypeId = Guid.NewGuid();
        var title = "Test Object";
        var description = "This is a test hindrance object.";

        // Act
        var result =
            await _hindranceService.CreateObject(reportId, hindranceTypeId, title, description, GeometryType.Point);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(title, result.Title);
        Assert.Equal(description, result.Description);
        Assert.Equal(reportId, result.ReportId);
        Assert.Equal(hindranceTypeId, result.HindranceTypeId);
        Assert.Equal(ReviewStatus.Draft, result.ReviewStatus);
    }

    [Fact]
    public void UpdateObject_ShouldUpdateHindranceObject()
    {
        // Arrange
        var obj = new HindranceObjectTable
        {
            Title = "Old Title",
            Description = "Old Description",
            HindranceTypeId = Guid.NewGuid(),
            GeometryType = GeometryType.Point
        };
        var newHindranceTypeId = Guid.NewGuid();
        var newTitle = "New Title";
        var newDescription = "New Description";
        var newGeometryType = GeometryType.Area;

        // Act
        _hindranceService.UpdateObject(obj, newHindranceTypeId, newTitle, newDescription, newGeometryType);

        // Assert
        Assert.Equal(newTitle, obj.Title);
        Assert.Equal(newDescription, obj.Description);
        Assert.Equal(newHindranceTypeId, obj.HindranceTypeId);
        Assert.Equal(newGeometryType, obj.GeometryType);
    }

    [Fact]
    public async Task AddPoints_ShouldAddHindrancePoints()
    {
        // Arrange
        var hindranceObjectId = Guid.NewGuid();
        var points = new List<PlacedPointDataModel>
        {
            new() { Lat = 60.0, Lng = 10.0 },
            new() { Lat = 61.0, Lng = 11.0 }
        };

        // Act
        await _hindranceService.AddPoints(hindranceObjectId, points);

        // Assert
        await _dbContext.HindrancePoints.Received().AddRangeAsync(Arg.Any<IEnumerable<HindrancePointTable>>());
    }

    [Fact]
    public async Task GetAllObjectsSince_ShouldReturnObjects()
    {
        // Arrange
        var since = DateTime.UtcNow;
        var objDate1 = since.AddDays(-5);
        var objDate2 = since.AddHours(-12);
        var objDate3 = since.AddHours(1);
        var mockObjects = new List<HindranceObjectTable>
        {
            new()
            {
                Id = Guid.NewGuid(), Title = "Object 1", HindranceTypeId = Guid.NewGuid(),
                Description = "Desc 1"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Object 2", HindranceTypeId = Guid.NewGuid(),
                Description = "Desc 2"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Object 3", HindranceTypeId = Guid.NewGuid(),
                Description = "Desc 3"
            }
        };

        await _dbContext.Set<HindranceObjectTable>().AddRangeAsync(mockObjects);

        mockObjects[0].CreatedAt = objDate1;
        mockObjects[0].UpdatedAt = objDate1;

        mockObjects[1].CreatedAt = objDate2;
        mockObjects[1].UpdatedAt = objDate2;

        mockObjects[2].CreatedAt = objDate3;
        mockObjects[2].UpdatedAt = objDate3;
        await _dbContext.SaveChangesAsync();
        _dbContext.ChangeTracker.Clear();

        // Act
        var result1 = await _hindranceService.GetAllObjectsSince();
        var result2 = await _hindranceService.GetAllObjectsSince(since);

        // Assert
        Assert.Equal(3, result1.Count);
        Assert.Single(result2);
        Assert.Equal("Object 3", result2[0].Title);
    }
}
