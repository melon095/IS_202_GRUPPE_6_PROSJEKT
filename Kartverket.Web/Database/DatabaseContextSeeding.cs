using Kartverket.Web.Database.Tables;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Database;

public static class DatabaseContextSeeding
{
    public static async Task Seed(DatabaseContext context)
    {
        try
        {
            await SeedHindranceTypes.Seed(context);
        }
        finally
        {
            await context.SaveChangesAsync();
        }
    }
}

public static class SeedHindranceTypes
{
    public static async Task Seed(DatabaseContext context)
    {
        var types = new List<HindranceTypeTable>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Lyktestolpe",
                PrimaryImageUrl = "/images/map-objects/Lyktestolpe.svg",
                MarkerImageUrl = "/images/map-objects/Lyktestolpe.svg"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Kraftlinje",
                PrimaryImageUrl = "/images/map-objects/Kraftlinje.svg",
                MarkerImageUrl = "/images/map-objects/Kraftlinje.svg"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Flagg Stang",
                PrimaryImageUrl = "/images/map-objects/Flagg.svg",
                MarkerImageUrl = "/images/map-objects/Flagg.svg"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Kommunikasjons Tårn",
                PrimaryImageUrl = "/images/map-objects/Radiomast.svg",
                MarkerImageUrl = "/images/map-objects/Radiomast.svg"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Kran",
                PrimaryImageUrl = "/images/map-objects/Heisekran.svg",
                MarkerImageUrl = "/images/map-objects/Heisekran.svg"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Vind Mølle",
                PrimaryImageUrl = "/images/map-objects/VindMolle.svg",
                MarkerImageUrl = "/images/map-objects/VindMolle.svg"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Bro",
                PrimaryImageUrl = "/images/map-objects/Bro.svg",
                MarkerImageUrl = "/images/map-objects/Bro.svg"
            }
        };

        foreach (var type in types)
        {
            var existingType = await context.HindranceTypes
                .FirstOrDefaultAsync(t => t.Name == type.Name);

            if (existingType == null)
            {
                await context.HindranceTypes.AddAsync(type);
            }
            else
            {
                existingType.PrimaryImageUrl = type.PrimaryImageUrl;
                existingType.MarkerImageUrl = type.MarkerImageUrl;
                context.HindranceTypes.Update(existingType);
            }
        }
    }
}
