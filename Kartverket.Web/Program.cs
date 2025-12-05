using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting.StaticWebAssets;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using Vite.AspNetCore;

#region Builder

var builder = WebApplication.CreateBuilder(args);

var isInDocker = builder.Configuration.GetValue<bool>("DOTNET_RUNNING_IN_DOCKER");

builder.Services.AddControllersWithViews();

builder.Services.AddDbContext<DatabaseContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    Debug.Assert(connectionString != null,
        $"Du glemte DefaultConnection i din appsettings.{builder.Environment.EnvironmentName}.json fil!");

    var version = ServerVersion.AutoDetect(connectionString);

    options.UseMySql(connectionString, version, mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure(
            5,
            TimeSpan.FromSeconds(10),
            null);
    });
});

builder.Services
    .AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<DatabaseContext>())
    .AddScoped<IReportService, ReportService>()
    .AddScoped<IHindranceService, HindranceService>()
    .AddScoped<IJourneyOrchestrator, JourneyOrchestrator>()
    .AddScoped<IObjectTypesService, ObjectTypesService>();

builder.Services.AddHttpClient("StadiaTiles", (s, h) =>
{
    var config = s.GetRequiredService<IConfiguration>();
    var userAgent = config["UserAgent"];

    h.BaseAddress = new Uri("https://tiles.stadiamaps.com");
    h.DefaultRequestHeaders.Referrer = new Uri("https://localhost:7243");
    h.DefaultRequestHeaders.Add("User-Agent", userAgent);
});

builder.Services.AddHttpContextAccessor();

#region Authentication

// https://source.dot.net/#Microsoft.AspNetCore.Identity/IdentityServiceCollectionExtensions.cs,b869775e5fa5aa5c

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(RoleValue.AtLeastBruker, p => { p.Requirements.Add(new MinimumRoleRequirement(RoleValue.Bruker)); })
    .AddPolicy(RoleValue.AtLeastPilot, p => { p.Requirements.Add(new MinimumRoleRequirement(RoleValue.Pilot)); })
    .AddPolicy(RoleValue.AtLeastKartverket,
        p => { p.Requirements.Add(new MinimumRoleRequirement(RoleValue.Kartverket)); });

builder.Services.AddSingleton<IAuthorizationHandler, MinimumRoleHandler>();

builder.Services.AddAuthentication();

builder.Services.AddIdentity<UserTable, RoleTable>(o =>
    {
        o.Password.RequiredLength = 8;
        o.Password.RequireDigit = true;
        o.Password.RequireLowercase = true;
        o.Password.RequireUppercase = true;
        o.Password.RequireNonAlphanumeric = false;
        o.User.RequireUniqueEmail = false;
        o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
        o.Lockout.MaxFailedAccessAttempts = 5;
        o.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<DatabaseContext>();

builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.Name = "Kartverket.Web.6";
    o.LoginPath = "/User/Login";
    o.AccessDeniedPath = "/User/AccessDenied";
    o.SlidingExpiration = true;
    o.ExpireTimeSpan = TimeSpan.FromHours(2);
    o.Cookie.HttpOnly = true;
    o.Cookie.SameSite = SameSiteMode.Lax;

    // Ved bruk av ConfigureApplicationCookie kan vi bestemme hvordan utløp skal håndteres ved persistent cookie
    // Dersom brukeren trykker på "Husk Meg" knappen ved innlogging settes IsPersistent til true
    // som gjør at cookien varer i 1 år, ellers i 2 timer.
    // Formålet med dette er å kunne ha lengre økter for brukere som ønsker det, dette er gunstig for en pilot
    // fordi det reduserer friksjon ved begynnelsen av en flytur.
    o.Events = new CookieAuthenticationEvents
    {
        OnSigningIn = ctx =>
        {
            if (ctx.Properties.IsPersistent)
            {
                ctx.Properties.ExpiresUtc = DateTimeOffset.UtcNow.AddDays(365);
                ctx.CookieOptions.MaxAge = TimeSpan.FromDays(365);
            }
            else
            {
                ctx.Properties.ExpiresUtc = DateTimeOffset.UtcNow.AddHours(2);
                ctx.CookieOptions.MaxAge = null;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddSession(o =>
{
    o.Cookie.Name = "Kartverket.Web.Session.6";
    o.IdleTimeout = TimeSpan.FromHours(2);
    o.Cookie.IsEssential = true;
});

if (isInDocker)
{
    // Definert i docker-compose.yaml filen
    var dataPath = "/app/data";

    if (!Directory.Exists(dataPath))
    {
        Directory.CreateDirectory(dataPath);
    }

    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataPath))
        .SetApplicationName("Kartverket.Web");
}


#endregion // Authentication

builder.Services.AddViteServices();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Vite", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            var host = builder.Configuration["Vite:Server:Host"] ?? "localhost";
            policy.WithOrigins($"http://{host}:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

#endregion // Builder

#region App

var app = builder.Build();
StaticWebAssetsLoader.UseStaticWebAssets(app.Environment, app.Configuration);

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DatabaseContext>();

    await db.Database.MigrateAsync();
    await DatabaseContextSeeding.Seed(db);
}

{
    using var scope = app.Services.CreateScope();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<RoleTable>>();

    foreach (var roleName in RoleValue.AllRoles)
    {
        var roleExists = await roleManager.RoleExistsAsync(roleName);
        if (!roleExists)
        {
            var role = new RoleTable { Name = roleName };
            await roleManager.CreateAsync(role);
        }
    }
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("Vite");

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();
app.UseStaticFiles();

app.MapControllerRoute(
        "default",
        "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

// Note: Must be the at the end.
if (app.Environment.IsDevelopment())
{
    app.UseWebSockets();
    app.UseViteDevelopmentServer(true);
}

app.Run();

#endregion // App

