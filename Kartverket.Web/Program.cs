using System.Diagnostics;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Hosting.StaticWebAssets;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Vite.AspNetCore;

#region Builder

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services
    .AddTransient<MapService, MapService>()
    .AddTransient<UserService, UserService>()
    .AddTransient<GeoJSONService, GeoJSONService>()
    .AddTransient<ReportService, ReportService>();

builder.Services.AddDbContext<DatabaseContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    Debug.Assert(connectionString != null,
        $"Du glemte DefaultConnection i din appsettings.{builder.Environment.EnvironmentName}.json fil!");
    
    var version = ServerVersion.AutoDetect(connectionString);
    
    options.UseMySql(connectionString, version, mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);
    });
});

// https://source.dot.net/#Microsoft.AspNetCore.Identity/IdentityServiceCollectionExtensions.cs,b869775e5fa5aa5c

builder.Services.AddAuthorization();
builder.Services.AddAuthentication();
    // .AddCookie(IdentityConstants.ApplicationScheme, options =>
    // {
    //     options.Cookie.Name = "Kartverket.Web.6.Auth";
    //     options.LoginPath = "/User/Login";
    //     options.AccessDeniedPath = "/User/AccessDenied";
    //     options.Events = new CookieAuthenticationEvents()
    //     {
    //         OnValidatePrincipal = SecurityStampValidator.ValidatePrincipalAsync
    //     };
    // });

builder.Services.AddIdentity<UserTable, RoleTable>((o) =>
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

builder.Services.AddHttpContextAccessor();
// builder.Services
//     .AddScoped<SignInManager<UserTable>>()
//     .AddScoped()
//     .AddScoped<RoleManager<RoleTable>>();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.AddViteServices();

#endregion

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
    db.Database.Migrate();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();
app.UseStaticFiles();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

// Note: Must be the at the end.
if (app.Environment.IsDevelopment())
{
    app.UseWebSockets();
    app.UseViteDevelopmentServer(true);
}

app.Run();

#endregion
