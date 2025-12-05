using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.Map;
using Kartverket.Web.Models.Map.Request;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Services;

public interface IHindranceService
{
    /// <summary>
    ///     Hent alle hindringstyper
    /// </summary>
    /// <returns>Liste over hindringstyper</returns>
    Task<List<HindranceTypeTable>> GetAllTypes(CancellationToken cancellationToken = default);

    /// <summary>
    ///     Opprett et nytt hindringsobjekt
    /// </summary>
    /// <param name="reportId">Rapport-id</param>
    /// <param name="hindranceTypeId">Hindringstype-id</param>
    /// <param name="title">Tittel</param>
    /// <param name="description">Beskrivelse</param>
    /// <param name="geometryType">Geometri-type</param>
    /// <param name="cancellationToken">Avbruddstoken</param>
    /// <returns>Det opprettede hindringsobjektet</returns>
    Task<HindranceObjectTable> CreateObject(
        Guid reportId,
        Guid hindranceTypeId,
        string title,
        string description,
        GeometryType geometryType,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Oppdater et eksisterende hindringsobjekt
    /// </summary>
    /// <param name="obj">Hindringsobjektet som skal oppdateres</param>
    /// <param name="hindranceTypeId">Hindringstype-id</param>
    /// <param name="title">Tittel</param>
    /// <param name="description">Beskrivelse</param>
    /// <param name="geometryType">Geometri-type</param>
    /// <param name="cancellationToken">Avbruddstoken</param>
    void UpdateObject(
        HindranceObjectTable obj,
        Guid hindranceTypeId,
        string title,
        string description,
        GeometryType geometryType,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Legg til punkter til et hindringsobjekt
    /// </summary>
    /// <param name="hindranceObjectId">Hindringsobjekt-id</param>
    /// <param name="points">Liste over punkter som skal legges til</param>
    /// <param name="cancellationToken">Avbruddstoken</param>
    Task AddPoints(
        Guid hindranceObjectId,
        List<PlacedPointDataModel> points,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Slett et hindringsobjekt
    /// </summary>
    /// <param name="hindranceObjectId">Hindringsobjekt-id</param
    void DeleteObject(Guid hindranceObjectId);

    /// <summary>
    ///     Hent alle hindringsobjekter siden en gitt dato
    /// </summary>
    /// <param name="user">Brukeren som gjør forespørselen</param>
    /// <param name="roleName">Rollen til brukeren</param>
    /// <param name="ignoreReportId">Rapport-id som skal ignoreres (valgfritt)</param>
    /// <param name="since">Dato som objektene skal være opprettet eller oppdatert etter (valgfritt)</param>
    /// <param name="cancellationToken">Avbruddstoken</param>
    /// <returns>Liste over hindringsobjekter</returns>
    Task<List<MapObjectDataModel>> GetAllObjectsSince(
        UserTable user,
        string roleName,
        Guid? ignoreReportId = null,
        DateTime? since = null,
        CancellationToken cancellationToken = default);
}

public class HindranceService : IHindranceService
{
    private readonly DatabaseContext _dbContext;

    public HindranceService(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<List<HindranceTypeTable>> GetAllTypes(CancellationToken cancellationToken = default) =>
        await _dbContext.HindranceTypes
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .ToListAsync(cancellationToken);

    /// <inheritdoc />
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

    /// <inheritdoc />
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

    /// <inheritdoc />
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
            Label = p.Label,
            CreatedAt = p.CreatedAt,
            Order = idx
        }).ToList();

        await _dbContext.HindrancePoints.AddRangeAsync(pointEntities, cancellationToken);
    }

    /// <inheritdoc />
    public void DeleteObject(Guid hindranceObjectId)
    {
        var obj = _dbContext.HindranceObjects
            .Include(o => o.HindrancePoints)
            .FirstOrDefault(o => o.Id == hindranceObjectId);

        if (obj == null) return;

        _dbContext.HindrancePoints.RemoveRange(obj.HindrancePoints);
        _dbContext.HindranceObjects.Remove(obj);
    }

    /// <inheritdoc />
    public Task<List<MapObjectDataModel>> GetAllObjectsSince(
        UserTable user,
        string roleName,
        Guid? ignoreReportId = null,
        DateTime? since = null,
        CancellationToken cancellationToken = default)
    {
        // Bygg opp spørringen
        var query = _dbContext.HindranceObjects
            .AsNoTracking()
            .Include(o => o.HindranceType)
            .Include(o => o.HindrancePoints)
            .Include(o => o.Report)
            .ThenInclude(r => r.ReportedBy)
            .ThenInclude(u => u.Role)
            .AsQueryable();

        // Filtrer på siden av dato hvis angitt
        if (since.HasValue)
            query = query.Where(o => o.CreatedAt >= since.Value || o.UpdatedAt >= since.Value);

        // Filtrer bort et spesifikt rapport-id hvis angitt
        if (ignoreReportId.HasValue && ignoreReportId.Value != Guid.Empty)
            query = query.Where(o => o.ReportId != ignoreReportId.Value);

        query = roleName switch
        {
            // Hvis bruker er Kartverket
            _ when roleName.Equals(RoleValue.Kartverket, StringComparison.OrdinalIgnoreCase)
                // Ser alle objekter på kartet med mindre de er avslått
                => query.Where(o => o.ReviewStatus != ReviewStatus.Closed),
            // Hvis bruker er en pilot
            _ when roleName.Equals(RoleValue.Pilot, StringComparison.OrdinalIgnoreCase)
                => query.Where(o =>
                    // Ser sine egne obkekter, med mindre de er avslått
                    (o.Report.ReportedById == user.Id && o.ReviewStatus != ReviewStatus.Closed) ||
                    // Andre piloter og kartverkets objekter, dersom de ikke er avslått
                    (o.Report.ReportedBy.Role.Name != RoleValue.Bruker &&
                     o.ReviewStatus != ReviewStatus.Closed) ||
                    // Hvis en vanlig bruker har en godkjent objekt
                    (o.Report.ReportedBy.Role.Name == RoleValue.Bruker &&
                     o.ReviewStatus == ReviewStatus.Resolved)
                ),
            // Hvis bruker er vanlig bruker
            _ when roleName.Equals(RoleValue.Bruker, StringComparison.OrdinalIgnoreCase)
                => query.Where(o =>
                    // Ser sin egen rapport, men ikke hvis den er avslått
                    (o.Report.ReportedById == user.Id && o.ReviewStatus != ReviewStatus.Closed) ||
                    // Ser andres hindringer om de er godkjent
                    o.ReviewStatus == ReviewStatus.Resolved),

            // Ugyldig rolle dersom det oppstår
            _ => query.Where(o => false)
        };

        // Prosesser og returner resultatet
        return query
            // Sorter på opprettet og oppdatert dato
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
                        CreatedAt = mp.CreatedAt
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);
    }
}
