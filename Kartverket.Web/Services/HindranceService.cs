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

    public async Task<HindranceTypeTable> GetHindranceTypeById(Guid id, CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Fetching hindrance type {HindranceTypeId}", id);

        var hindranceType = await _dbContext.HindranceTypes.FindAsync([id], cancellationToken);
        if (hindranceType == null)
        {
            _logger.LogWarning("Hindrance type with ID {HindranceTypeId} not found", id);
            hindranceType = await _dbContext.HindranceTypes.FirstOrDefaultAsync(cancellationToken);
        }

        return hindranceType!;
    }

    public async Task<List<HindranceTypeTable>> GetAllHindranceTypes(CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Fetching all hindrance types");

        return await _dbContext.HindranceTypes.ToListAsync(cancellationToken);
    }

    public async Task<HindranceObjectTable> CreateHindranceObjectDraft(Guid reportedById,
        Guid? hindranceTypeId = null,
        CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Creating draft hindrance object for user {UserId}", reportedById);

        hindranceTypeId ??= (await _dbContext.HindranceTypes.FirstOrDefaultAsync(cancellationToken))?.Id;

        var hindranceObject = new HindranceObjectTable
        {
            Id = Guid.NewGuid(),
            Title = $"Utkast Hindring - {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
            Description = "",
            HindranceTypeId = hindranceTypeId!.Value
        };

        await _dbContext.HindranceObjects.AddAsync(hindranceObject, cancellationToken);

        return hindranceObject;
    }

    public async Task<List<HindrancePointTable>> AddHindrancePoints(Guid hindranceObjectId,
        List<PlacedPointDataModel> points,
        CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Adding {PointCount} points to hindrance object {HindranceObjectId}", points.Count,
                hindranceObjectId);

        var hindrancePoints = new List<HindrancePointTable>();
        var order = 0;

        foreach (var point in points)
        {
            var hindrancePoint = new HindrancePointTable
            {
                Id = Guid.NewGuid(),
                Latitude = point.Lat,
                Longitude = point.Lng,
                Elevation = point.Elevation,
                CreatedAt = point.CreatedAt,
                HindranceObjectId = hindranceObjectId,
                Order = order++
            };

            hindrancePoints.Add(hindrancePoint);
        }

        await _dbContext.HindrancePoints.AddRangeAsync(hindrancePoints, cancellationToken);

        return hindrancePoints;
    }

    public async Task LinkHindranceObjectToReport(Guid reportId, Guid hindranceObjectId,
        CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Linking hindrance object {HindranceObjectId} to report {ReportId}", hindranceObjectId,
                reportId);

        var report = await _dbContext.Reports
            .Include(r => r.HindranceObjects)
            .FirstOrDefaultAsync(r => r.Id == reportId, cancellationToken);

        if (report == null)
        {
            _logger.LogWarning("Report with ID {ReportId} not found", reportId);
            return;
        }

        var hindranceObject = await _dbContext.HindranceObjects.FindAsync([hindranceObjectId], cancellationToken);
        if (hindranceObject == null)
        {
            _logger.LogWarning("Hindrance object with ID {HindranceObjectId} not found", hindranceObjectId);
            return;
        }

        report.HindranceObjects.Add(hindranceObject);
    }
}
