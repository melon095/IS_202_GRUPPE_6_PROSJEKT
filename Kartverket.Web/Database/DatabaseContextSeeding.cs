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
                Name = "Standard",
                ImageUrl = "/images/hindrances/Default.svg",
                GeometryType = GeometryType.Point
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Flagstaff",
                ImageUrl = "/images/hindrances/Flagstaff.svg",
                GeometryType = GeometryType.Point
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Mast",
                ImageUrl = "/images/hindrances/Mast.svg",
                GeometryType = GeometryType.Point
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Strømledning",
                ImageUrl = "/images/hindrances/Power.svg",
                GeometryType = GeometryType.Line
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Vindmølle",
                ImageUrl = "/images/hindrances/Wind.svg",
                GeometryType = GeometryType.Point
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Flyforbudssone",
                Colour = "#EEAF61",
                GeometryType = GeometryType.Area
            }
        };

        foreach (var type in types)
        {
            if (type.ImageUrl is { } url && !File.Exists($"wwwroot{url}"))
                continue;

            var existingType = await context.HindranceTypes
                .FirstOrDefaultAsync(t => t.Name == type.Name);

            if (existingType == null)
                await context.HindranceTypes.AddAsync(type);
            else
                existingType.ImageUrl = type.ImageUrl;
        }
    }
}
