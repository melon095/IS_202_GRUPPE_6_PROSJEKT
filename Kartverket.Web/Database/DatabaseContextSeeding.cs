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
            #region Standard

            new()
            {
                Id = Guid.NewGuid(),
                Name = HindranceTypeTable.DEFAULT_TYPE_NAME,
                ImageUrl = "/images/hindrances/Default.svg",
                GeometryType = GeometryType.Point
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = HindranceTypeTable.DEFAULT_TYPE_NAME,
                ImageUrl = "/images/hindrances/Default.svg",
                GeometryType = GeometryType.Line
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = HindranceTypeTable.DEFAULT_TYPE_NAME,
                ImageUrl = "/images/hindrances/Default.svg",
                GeometryType = GeometryType.Area
            },

            #endregion // Standard

            #region Point

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
                Name = "Vindmølle",
                ImageUrl = "/images/hindrances/Wind.svg",
                GeometryType = GeometryType.Point
            },

            #endregion // Point

            #region Line

            new()
            {
                Id = Guid.NewGuid(),
                Name = "Strømledning",
                ImageUrl = "/images/hindrances/Power.svg",
                GeometryType = GeometryType.Line
            },

            #endregion // Line

            #region Area

            new()
            {
                Id = Guid.NewGuid(),
                Name = "Flyforbudssone",
                Colour = "#8A02C0",
                GeometryType = GeometryType.Area
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Militært øvingsområde",
                Colour = "#FF0000",
                GeometryType = GeometryType.Area
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Naturreservat",
                Colour = "#008000",
                GeometryType = GeometryType.Area
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Nasjonalpark",
                Colour = "#00FF00",
                GeometryType = GeometryType.Area
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Vernområde for kulturminner",
                Colour = "#FFA500",
                GeometryType = GeometryType.Area
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Farlig terreng",
                Colour = "#FFFF00",
                GeometryType = GeometryType.Area
            },

            #endregion // Area
        };

        foreach (var type in types)
        {
            if (type.ImageUrl is { } url && !File.Exists($"wwwroot{url}"))
                continue;

            var existingType = await context.HindranceTypes
                .FirstOrDefaultAsync(t => t.Name == type.Name && t.GeometryType == type.GeometryType);

            if (existingType == null)
            {
                await context.HindranceTypes.AddAsync(type);
            }
            else
            {
                existingType.Colour = type.Colour;
                existingType.ImageUrl = type.ImageUrl;
            }
        }
    }
}
