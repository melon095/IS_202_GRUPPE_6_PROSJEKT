using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map;
using Kartverket.Web.Models.Map.Request;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Services;

public interface IHindranceService
{
    Task<List<HindranceTypeTable>> GetAllTypes(CancellationToken cancellationToken = default);

    Task<HindranceObjectTable> CreateObject(
        Guid reportId,
        Guid hindranceTypeId,
        string title,
        string description,
        GeometryType geometryType,
        CancellationToken cancellationToken = default);

    void UpdateObject(
        HindranceObjectTable obj,
        Guid hindranceTypeId,
        string title,
        string description,
        GeometryType geometryType,
        CancellationToken cancellationToken = default);

    Task AddPoints(
        Guid hindranceObjectId,
        List<PlacedPointDataModel> points,
        CancellationToken cancellationToken = default);

    void DeleteObject(Guid hindranceObjectId);

    Task<List<MapObjectDataModel>> GetAllObjectsSince(
        UserTable user,
        string roleName,
        Guid? ignoreReportId = null,
        DateTime? since = null,
        CancellationToken cancellationToken = default);
}

public class HindranceService : IHindranceService
{
    private readonly ILogger<HindranceService> _logger;
    private readonly DatabaseContext _dbContext;

    public HindranceService(ILogger<HindranceService> logger, DatabaseContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    public async Task<List<HindranceTypeTable>> GetAllTypes(CancellationToken cancellationToken = default) =>
        await _dbContext.HindranceTypes
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .ToListAsync(cancellationToken);

    public async Task<HindranceObjectTable> CreateObject(
        Guid reportId,
        Guid hindranceTypeId,
        string title,
        string description,
        GeometryType geometryType,
        CancellationToken cancellationToken = default)
    {
        var newObject = new HindranceObjectTable
        {
            Title = title,
            Description = description,
            ReviewStatus = ReviewStatus.Draft,
            ReportId = reportId,
            HindranceTypeId = hindranceTypeId,
            HindrancePoints = [],
            GeometryType = geometryType
        };

        await _dbContext.HindranceObjects.AddAsync(newObject, cancellationToken);

        return newObject;
    }

    public void UpdateObject(
        HindranceObjectTable obj,
        Guid hindranceTypeId,
        string title,
        string description,
        GeometryType geometryType,
        CancellationToken cancellationToken = default)
    {
        obj.Title = title;
        obj.Description = description;
        obj.HindranceTypeId = hindranceTypeId;
        obj.GeometryType = geometryType;
    }

    public async Task AddPoints(
        Guid hindranceObjectId,
        List<PlacedPointDataModel> points,
        CancellationToken cancellationToken = default)
    {
        var pointEntities = points.Select((p, idx) => new HindrancePointTable
        {
            Id = Guid.NewGuid(),
            HindranceObjectId = hindranceObjectId,
            Latitude = p.Lat,
            Longitude = p.Lng,
            Elevation = p.Elevation,
            Label = p.Label,
            CreatedAt = p.CreatedAt,
            // TODO: Order må komme som brukerinput!
            Order = idx
        }).ToList();

        await _dbContext.HindrancePoints.AddRangeAsync(pointEntities, cancellationToken);
    }

    public void DeleteObject(Guid hindranceObjectId)
    {
        var obj = _dbContext.HindranceObjects
            .Include(o => o.HindrancePoints)
            .FirstOrDefault(o => o.Id == hindranceObjectId);

        if (obj == null) return;

        _dbContext.HindrancePoints.RemoveRange(obj.HindrancePoints);
        _dbContext.HindranceObjects.Remove(obj);
    }

    public Task<List<MapObjectDataModel>> GetAllObjectsSince(
        UserTable user,
        string roleName,
        Guid? ignoreReportId = null,
        DateTime? since = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.HindranceObjects
            .AsNoTracking()
            .Include(o => o.HindranceType)
            .Include(o => o.HindrancePoints)
            .Include(o => o.Report)
            .ThenInclude(r => r.ReportedBy)
            .ThenInclude(u => u.Role)
            .AsQueryable();

        if (since.HasValue)
            query = query.Where(o => o.CreatedAt >= since.Value || o.UpdatedAt >= since.Value);

        if (ignoreReportId.HasValue && ignoreReportId.Value != Guid.Empty)
            query = query.Where(o => o.ReportId != ignoreReportId.Value);

        query = roleName switch
        {
            _ when roleName.Equals(RoleValue.Pilot, StringComparison.OrdinalIgnoreCase) =>
                query.Where(o =>
                    o.Report.ReportedById == user.Id ||
                    (o.Report.ReportedBy.Role != null && o.Report.ReportedBy.Role.Name != RoleValue.User &&
                     o.ReviewStatus != ReviewStatus.Closed) ||
                    (o.Report.ReportedBy.Role != null && o.Report.ReportedBy.Role.Name == RoleValue.User &&
                     o.ReviewStatus == ReviewStatus.Resolved)),

            _ when roleName.Equals(RoleValue.User, StringComparison.OrdinalIgnoreCase) =>
                query.Where(o =>
                    o.Report.ReportedById == user.Id ||
                    o.ReviewStatus == ReviewStatus.Resolved),

            _ when roleName.Equals(RoleValue.Kartverket, StringComparison.OrdinalIgnoreCase) =>
                query,

            _ => query.Where(o => false)
        };

        return query
            .OrderBy(o => o.CreatedAt)
            .ThenBy(o => o.UpdatedAt)
            .Select(o => new MapObjectDataModel
            {
                Id = o.Id,
                ReportId = o.ReportId,
                TypeId = o.HindranceTypeId,
                GeometryType = o.GeometryType,
                Title = o.Title,
                Points = o.HindrancePoints
                    .OrderBy(p => p.Order)
                    .Select(mp => new MapObjectDataModel.MapPoint
                    {
                        Lat = mp.Latitude,
                        Lng = mp.Longitude,
                        Alt = mp.Elevation,
                        CreatedAt = mp.CreatedAt
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);
    }
}
