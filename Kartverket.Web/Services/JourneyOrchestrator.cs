using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map.Request;

namespace Kartverket.Web.Services;

public interface IJourneyOrchestrator
{
    /// <summary>
    ///     Synkroniserer et objekt til en pågående reise (draft rapport).
    ///     Hvis journeyId er null eller tom, opprettes en ny draft rapport.
    /// </summary>
    /// <param name="userId">Bruker-ID for eieren av reisen.</param>
    /// <param name="journeyId">ID for den pågående reisen (draft rapport).</param>
    /// <param name="body">Data for objektet som skal synkroniseres.</param>
    /// <param name="cancellationToken">Avbestillings-token.</param>
    /// <returns>Tuple med JourneyId og ObjectId.</returns>
    Task<(Guid JourneyId, Guid ObjectId)> SyncObject(
        Guid userId,
        Guid? journeyId,
        PlacedObjectDataModel body,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Fullfører en pågående reise (draft rapport) ved å oppdatere rapporten og dens objekter.
    /// </summary>
    /// <param name="journeyId">ID for den pågående reisen (draft rapport).</param>
    /// <param name="request">Data for å fullføre reisen.</param>
    /// <param name="cancellationToken">Avbestillings-token.</param>
    /// <returns>ID for den fullførte reisen (rapport).</returns>
    Task<Guid> Finalise(
        Guid journeyId,
        FinalizeJourneyRequest request,
        CancellationToken cancellationToken = default);
}

public class JourneyOrchestrator : IJourneyOrchestrator
{
    private readonly IReportService _reportService;
    private readonly IHindranceService _hindranceService;

    public JourneyOrchestrator(IReportService reportService,
        IHindranceService hindranceService)
    {
        _reportService = reportService;
        _hindranceService = hindranceService;
    }

    #region SyncObject

    /// <inheritdoc />
    public async Task<(Guid JourneyId, Guid ObjectId)> SyncObject(
        Guid userId,
        Guid? journeyId,
        PlacedObjectDataModel body,
        CancellationToken cancellationToken = default)
    {
        var report = await GetOrCreateDraft(userId, journeyId, cancellationToken);

        var typeCache = await BuildTypeCache(cancellationToken);
        var defaultTypeId = GetDefaultTypeId(body.GeometryType, typeCache);

        var hindranceTypeId = body.TypeId.HasValue && typeCache.ContainsKey(body.TypeId.Value)
            ? body.TypeId.Value
            : defaultTypeId;

        var obj = await _hindranceService.CreateObject(
            report.Id,
            hindranceTypeId,
            $"Object - {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
            string.Empty,
            body.GeometryType,
            cancellationToken);

        report.HindranceObjects.Add(obj);

        var points = body.Points.Select(p => new PlacedPointDataModel
        {
            Lat = p.Lat,
            Lng = p.Lng,
            CreatedAt = p.CreatedAt
        }).ToList();

        if (points.Count > 0)
            await _hindranceService.AddPoints(obj.Id, points, cancellationToken);

        return (report.Id, obj.Id);
    }

    /// <summary>
    ///     Henter en eksisterende draft rapport eller oppretter en ny hvis ingen finnes.
    /// </summary>
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

    /// <inheritdoc />
    public async Task<Guid> Finalise(Guid journeyId, FinalizeJourneyRequest request,
        CancellationToken cancellationToken = default)
    {
        var report = await _reportService.GetDraft(journeyId, cancellationToken);
        if (report == null)
            throw new InvalidOperationException($"Draft report with ID {journeyId} not found.");

        _reportService.FinaliseReport(report, request.Journey.Title, request.Journey.Description);

        var typeCache = await BuildTypeCache(cancellationToken);
        foreach (var objDto in request.Objects)
        {
            var defaultTypeId = GetDefaultTypeId(objDto.GeometryType, typeCache);

            if (objDto.Deleted)
            {
                await DeleteObject(report, objDto.Id, cancellationToken);
                continue;
            }

            await ProcessObject(report, objDto, typeCache, defaultTypeId, cancellationToken);
        }

        return report.Id;
    }

    /// <summary>
    ///     Behandler et objekt under finalisering av en reise.
    /// </summary>
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
                objDto.GeometryType,
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
                objDto.GeometryType,
                cancellationToken);
        }

        var existingPoints = obj.HindrancePoints
            .Select(p => (p.Latitude, p.Longitude))
            .ToHashSet();

        var newPoints = objDto.Points
            .Where(p => !existingPoints.Contains((p.Lat, p.Lng)))
            .Select(p => new PlacedPointDataModel
            {
                Lat = p.Lat,
                Lng = p.Lng,
                CreatedAt = p.CreatedAt
            })
            .ToList();

        if (newPoints.Count > 0)
            await _hindranceService.AddPoints(obj.Id, newPoints, cancellationToken);
    }

    /// <summary>
    ///     Sletter et objekt fra rapporten.
    /// </summary>
    private Task DeleteObject(ReportTable report, Guid objDtoId, CancellationToken cancellationToken)
    {
        var obj = report.HindranceObjects.FirstOrDefault(o => o.Id == objDtoId);
        if (obj is { } o)
        {
            _hindranceService.DeleteObject(o.Id);
            report.HindranceObjects.Remove(o);
        }

        return Task.CompletedTask;
    }

    /// <summary>
    ///     Bygger en cache av hindringstyper for rask oppslag.
    /// </summary>
    private async Task<Dictionary<Guid, HindranceTypeTable>> BuildTypeCache(CancellationToken cancellationToken)
    {
        var types = await _hindranceService.GetAllTypes(cancellationToken);
        return types.ToDictionary(t => t.Id, t => t);
    }

    /// <summary>
    ///     Henter standardtype-ID for en gitt geometritype.
    /// </summary>
    private Guid GetDefaultTypeId(GeometryType type, Dictionary<Guid, HindranceTypeTable> typeCache)
    {
        var defaultTypeId = typeCache.Where(x => x.Value.Name == HindranceTypeTable.DEFAULT_TYPE_NAME &&
                                                 x.Value.GeometryType == type)
            .Select(x => x.Key)
            .FirstOrDefault();

        if (defaultTypeId == Guid.Empty)
            throw new InvalidOperationException($"Ingen standardtype funnet for hindring. GeometryType: {type}");

        return defaultTypeId;
    }

    #endregion // Finalise
}
