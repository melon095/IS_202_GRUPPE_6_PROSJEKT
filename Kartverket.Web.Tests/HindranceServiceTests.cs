using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map.Request;
using Kartverket.Web.Services;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Tests;

public class HindranceServiceTests
{
    private readonly DatabaseContext _dbContext;
    private readonly IHindranceService _hindranceService;

    public HindranceServiceTests()
    {
        _dbContext = Create.MockedDbContextFor<DatabaseContext>();
        _hindranceService = new HindranceService(_dbContext);
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
            new() { Lat = 60.0, Lng = 10.0, Label = "Point 1", CreatedAt = DateTime.UtcNow },
            new() { Lat = 61.0, Lng = 11.0, Label = "Point 2", CreatedAt = DateTime.UtcNow }
        };

        // Act
        await _hindranceService.AddPoints(hindranceObjectId, points);
        await _dbContext.SaveChangesAsync();

        // Assert
        var addedPoints = await _dbContext.HindrancePoints.Where(p => p.HindranceObjectId == hindranceObjectId)
            .ToListAsync();
        Assert.Equal(2, addedPoints.Count);
        Assert.Equal(60.0, addedPoints[0].Latitude);
        Assert.Equal(10.0, addedPoints[0].Longitude);
    }

    [Fact]
    public async Task GetAllObjectsSince_ShouldReturnObjects()
    {
        // Arrange
        var since = DateTime.UtcNow;
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        var role = new RoleTable { Id = roleId, Name = RoleValue.Kartverket };
        var user = new UserTable { Id = userId, RoleId = roleId, Role = role, IsActive = true };
        var report = new ReportTable
        {
            Id = Guid.NewGuid(), ReportedById = userId, ReportedBy = user, Title = "", Description = "",
            ReviewStatus = ReviewStatus.Draft
        };

        await _dbContext.Roles.AddAsync(role);
        await _dbContext.Users.AddAsync(user);
        await _dbContext.Reports.AddAsync(report);
        await _dbContext.SaveChangesAsync();

        var objDate1 = since.AddDays(-5);
        var objDate2 = since.AddHours(-12);
        var objDate3 = since.AddHours(1);

        var hindranceType = new HindranceTypeTable
            { Id = Guid.NewGuid(), Name = "Test Type", GeometryType = GeometryType.Point };
        await _dbContext.HindranceTypes.AddAsync(hindranceType);

        var mockObjects = new List<HindranceObjectTable>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Object 1",
                HindranceTypeId = hindranceType.Id,
                HindranceType = hindranceType,
                Description = "Desc 1",
                ReportId = report.Id,
                Report = report,
                CreatedAt = objDate1,
                UpdatedAt = objDate1,
                GeometryType = GeometryType.Point,
                ReviewStatus = ReviewStatus.Resolved,
                HindrancePoints = new List<HindrancePointTable>()
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Object 2",
                HindranceTypeId = hindranceType.Id,
                HindranceType = hindranceType,
                Description = "Desc 2",
                ReportId = report.Id,
                Report = report,
                CreatedAt = objDate2,
                UpdatedAt = objDate2,
                GeometryType = GeometryType.Point,
                ReviewStatus = ReviewStatus.Resolved,
                HindrancePoints = new List<HindrancePointTable>()
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Object 3",
                HindranceTypeId = hindranceType.Id,
                HindranceType = hindranceType,
                Description = "Desc 3",
                ReportId = report.Id,
                Report = report,
                CreatedAt = objDate3,
                UpdatedAt = objDate3,
                GeometryType = GeometryType.Point,
                ReviewStatus = ReviewStatus.Resolved,
                HindrancePoints = new List<HindrancePointTable>()
            }
        };

        await _dbContext.HindranceObjects.AddRangeAsync(mockObjects);
        await _dbContext.SaveChangesAsync();
        _dbContext.ChangeTracker.Clear();

        // Act
        var result1 = await _hindranceService.GetAllObjectsSince(user, RoleValue.Kartverket);
        var result2 = await _hindranceService.GetAllObjectsSince(user, RoleValue.Kartverket, since: since);

        // Assert
        Assert.Equal(3, result1.Count);
        Assert.Single(result2);
        Assert.Equal("Object 3", result2[0].Title);
    }
}
