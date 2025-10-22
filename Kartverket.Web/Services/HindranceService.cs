using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map.Request;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Services;

public class HindranceService
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
        CancellationToken cancellationToken = default)
    {
        var newObject = new HindranceObjectTable
        {
            Title = title,
            Description = description,
            ReviewStatus = ReviewStatus.Draft,
            ReportId = reportId,
            HindranceTypeId = hindranceTypeId
        };

        await _dbContext.HindranceObjects.AddAsync(newObject, cancellationToken);

        return newObject;
    }

    public void UpdateObject(
        HindranceObjectTable obj,
        Guid hindranceTypeId,
        string title,
        string description,
        CancellationToken cancellationToken = default)
    {
        obj.Title = title;
        obj.Description = description;
        obj.HindranceTypeId = hindranceTypeId;
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

    public void DeleteObject(Guid hindranceObjectId, CancellationToken cancellationToken = default)
    {
        var obj = new HindranceObjectTable { Id = hindranceObjectId };
        _dbContext.HindranceObjects.Attach(obj);
        _dbContext.HindranceObjects.Remove(obj);
    }

    public Task<List<HindranceObjectTable>> GetAllObjectsSince(DateTime? since = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.HindranceObjects
            .AsNoTracking()
            .AsQueryable();

        if (since != null) query = query.Where(t => t.CreatedAt >= since || t.UpdatedAt >= since);

        return query
            .Include(o => o.HindranceType)
            .Include(o => o.HindrancePoints)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
