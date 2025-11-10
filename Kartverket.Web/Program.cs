using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting.StaticWebAssets;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using Vite.AspNetCore;

#region Builder

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<DatabaseContext>())
    .AddScoped<IReportService, ReportService>()
    .AddScoped<IHindranceService, HindranceService>()
    .AddScoped<IJourneyOrchestrator, JourneyOrchestrator>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped(typeof(CancellationToken), s =>
{
    var httpContextAccessor = s.GetRequiredService<IHttpContextAccessor>();
    return httpContextAccessor.HttpContext?.RequestAborted ?? CancellationToken.None;
});

#region Authentication

// https://source.dot.net/#Microsoft.AspNetCore.Identity/IdentityServiceCollectionExtensions.cs,b869775e5fa5aa5c

builder.Services.AddAuthorization(o =>
{
    o.AddPolicy(RoleValue.AtLeastUser, p => { p.Requirements.Add(new MinimumRoleRequirement(RoleValue.User)); });
    o.AddPolicy(RoleValue.AtLeastPilot, p => { p.Requirements.Add(new MinimumRoleRequirement(RoleValue.Pilot)); });
    o.AddPolicy(RoleValue.AtLeastKartverket,
        p => { p.Requirements.Add(new MinimumRoleRequirement(RoleValue.Kartverket)); });
});
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
    o.ExpireTimeSpan = TimeSpan.FromMinutes(30);
});

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

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
        // else
        // {
        //     policy.AllowAnyOrigin()
        //         .AllowAnyHeader()
        //         .AllowAnyMethod()
        //         .AllowCredentials();
        // }
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
    var db = app.Services.CreateScope().ServiceProvider.GetRequiredService<DatabaseContext>();
    await db.Database.MigrateAsync();
    await DatabaseContextSeeding.Seed(db);
}

{
    var roleManager = app.Services.CreateScope().ServiceProvider.GetRequiredService<RoleManager<RoleTable>>();
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
