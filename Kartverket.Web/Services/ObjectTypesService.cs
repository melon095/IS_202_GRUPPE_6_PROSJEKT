using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.ObjectTypes.Response;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Kartverket.Web.Services;

public interface IObjectTypesService
{
    /// <summary>
    ///     Genererer en liste over objekt typer
    /// </summary>
    /// <returns>Objekt Typer</returns>
    ValueTask<ObjectTypesDataModel> List(CancellationToken cancellationToken = default);
}

public class ObjectTypesService : IObjectTypesService
{
    private const string CACHE_KEY = "ObjectTypesCache";
    private static readonly GeometryType[] GEOMETRY_TYPE_VALUES = Enum.GetValues<GeometryType>();

    private readonly DatabaseContext _dbContext;
    private readonly IMemoryCache _cache;

    public ObjectTypesService(DatabaseContext dbContext, IMemoryCache cache)
    {
        _dbContext = dbContext;
        _cache = cache;
    }

    /// <inheritdoc />
    public async ValueTask<ObjectTypesDataModel> List(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue<ObjectTypesDataModel>(CACHE_KEY, out var cachedData) && cachedData != null)
            return cachedData;

        var objectTypes = await _dbContext.HindranceTypes
            .Select(ot => new ObjectTypesDataModel.ObjectType
            {
                Id = ot.Id,
                Name = ot.Name,
                ImageUrl = ot.ImageUrl,
                Colour = ot.Colour,
                GeometryType = ot.GeometryType
            })
            .ToListAsync(cancellationToken);

        var standardTypeIds = new Dictionary<int, Guid>();
        foreach (var geometryType in GEOMETRY_TYPE_VALUES)
        {
            var standardType = objectTypes.FirstOrDefault(ot =>
                ot.Name == HindranceTypeTable.DEFAULT_TYPE_NAME && ot.GeometryType == geometryType);

            if (standardType != null) standardTypeIds[(int)geometryType] = standardType.Id;
        }

        var model = new ObjectTypesDataModel
        {
            ObjectTypes = objectTypes,
            StandardTypeIds = standardTypeIds
        };

        // @NOTE: Denne cachen blir aldri fjernet med mindre applikasjonen restartes,
        //        grunnen til dette er fordi objekt typer blir aldri endret i produksjon.
        //
        //        De er automatisk generert ved oppstart av databasen, blir ikke endret, slettet eller lagt til av brukere.
        _cache.Set(CACHE_KEY, model, new MemoryCacheEntryOptions
        {
            Priority = CacheItemPriority.NeverRemove
        });

        return model;
    }
}
