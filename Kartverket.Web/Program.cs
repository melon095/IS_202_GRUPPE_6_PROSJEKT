using System.Diagnostics;
using Kartverket.Web.Controllers;
using Kartverket.Web.Database;
using Kartverket.Web.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services
    .AddSingleton<DummyMapService, DummyMapService>()
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

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
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


app.Run();
