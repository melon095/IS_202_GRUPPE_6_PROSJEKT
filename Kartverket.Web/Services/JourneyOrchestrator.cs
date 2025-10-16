using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map.Request;

namespace Kartverket.Web.Services;

public class JourneyOrchestrator
{
    private readonly ILogger<JourneyOrchestrator> _logger;
    private readonly ReportService _reportService;
    private readonly HindranceService _hindranceService;

    public JourneyOrchestrator(ILogger<JourneyOrchestrator> logger, ReportService reportService,
        HindranceService hindranceService)
    {
        _logger = logger;
        _reportService = reportService;
        _hindranceService = hindranceService;
    }

    #region SyncObject

    public async Task<(Guid JourneyId, Guid ObjectId)> SyncObject(
        Guid userId,
        Guid? journeyId,
        PlacedObjectDataModel body,
        CancellationToken cancellationToken = default)
    {
        var report = await GetOrCreateDraft(userId, journeyId, cancellationToken);

        var typeCache = await BuildTypeCache(cancellationToken);
        var defaultTypeId = typeCache.Keys.FirstOrDefault();
        if (defaultTypeId == Guid.Empty)
            throw new InvalidOperationException("No hindrance types available to assign to the object.");
        var hindranceType = body.TypeId.HasValue && typeCache.ContainsKey(body.TypeId.Value)
            ? body.TypeId.Value
            : defaultTypeId;

        var obj = await _hindranceService.CreateObject(
            report.Id,
            hindranceType,
            $"Object - {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
            string.Empty,
            cancellationToken);

        report.HindranceObjects.Add(obj);

        var points = body.Points.Select(p => new PlacedPointDataModel
        {
            Lat = p.Lat,
            Lng = p.Lng,
            Elevation = p.Elevation,
            CreatedAt = p.CreatedAt
        }).ToList();

        if (points.Count > 0)
            await _hindranceService.AddPoints(obj.Id, points, cancellationToken);

        return (report.Id, obj.Id);
    }

    private async Task<ReportTable> GetOrCreateDraft(Guid userId, Guid? journeyId,
        CancellationToken cancellationToken = default)
    {
        if (journeyId.HasValue && journeyId.Value != Guid.Empty)
        {
            var existing = await _reportService.GetDraft(journeyId.Value, cancellationToken);
            if (existing != null)
                return existing;
        }

        return await _reportService.CreateDraft(userId, cancellationToken);
    }

    #endregion

    #region Finalise

    public async Task<Guid> Finalise(Guid journeyId, FinalizeJourneyRequest request,
        CancellationToken cancellationToken = default)
    {
        var report = await _reportService.GetDraft(journeyId, cancellationToken);
        if (report == null)
            throw new InvalidOperationException($"Draft report with ID {journeyId} not found.");

        _reportService.FinaliseReport(report, request.Journey.Title, request.Journey.Description);

        var typeCache = await BuildTypeCache(cancellationToken);
        var defaultTypeId = typeCache.Keys.FirstOrDefault();
        if (defaultTypeId == Guid.Empty)
            throw new InvalidOperationException("No hindrance types available to assign to the object.");

        foreach (var objDto in request.Objects)
        {
            if (objDto.Deleted)
            {
                await DeleteObject(report, objDto.Id, cancellationToken);
                continue;
            }

            await ProcessObject(report, objDto, typeCache, defaultTypeId, cancellationToken);
        }

        return report.Id;
    }

    private async Task ProcessObject(
        ReportTable report,
        FinalizeJourneyObject objDto,
        Dictionary<Guid, HindranceTypeTable> typeCache,
        Guid defaultTypeId,
        CancellationToken cancellationToken)
    {
        var typeId = objDto.TypeId ?? defaultTypeId;
        if (!typeCache.ContainsKey(typeId))
            typeId = defaultTypeId;

        var obj = report.HindranceObjects.FirstOrDefault(o => o.Id == objDto.Id);
        if (obj is null)
        {
            obj = await _hindranceService.CreateObject(
                report.Id,
                typeId,
                objDto.Title,
                objDto.Description,
                cancellationToken);

            report.HindranceObjects.Add(obj);
        }
        else
        {
            _hindranceService.UpdateObject(
                obj,
                typeId,
                objDto.Title,
                objDto.Description,
                cancellationToken);
        }

        var existingPoints = obj.HindrancePoints?
            .Select(p => (p.Latitude, p.Longitude, p.Elevation, p.CreatedAt))
            .ToHashSet() ?? new HashSet<(double, double, int, DateTime)>();

        var newPoints = objDto.Points
            .Select(p => (p.Lat, p.Lng, p.Elevation, p.CreatedAt))
            .Where(p => !existingPoints.Contains(p))
            .Select(p => new PlacedPointDataModel
            {
                Lat = p.Lat,
                Lng = p.Lng,
                Elevation = p.Elevation,
                CreatedAt = p.CreatedAt
            })
            .ToList();

        if (newPoints.Count > 0)
            await _hindranceService.AddPoints(obj.Id, newPoints, cancellationToken);
    }


    private async Task DeleteObject(ReportTable report, Guid objDtoId, CancellationToken cancellationToken)
    {
        var obj = report.HindranceObjects.FirstOrDefault(o => o.Id == objDtoId);
        if (obj is { } o)
        {
            _hindranceService.DeleteObject(o.Id, cancellationToken);
            report.HindranceObjects.Remove(o);
        }
    }

    private async Task<Dictionary<Guid, HindranceTypeTable>> BuildTypeCache(CancellationToken cancellationToken)
    {
        var types = await _hindranceService.GetAllTypes(cancellationToken);
        return types.ToDictionary(t => t.Id, t => t);
    }

    #endregion // Finalise
}
