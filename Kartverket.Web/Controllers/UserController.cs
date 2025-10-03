using System.Security.Claims;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.User.Request;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

public class UserController : Controller
{
    private readonly ILogger<UserController> _logger;
    private readonly DatabaseContext _dbContext;
    
    public UserController(ILogger<UserController> logger, DatabaseContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }
    
    [HttpGet]
    public IActionResult Login()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Login(UserLoginRequestModel body)
    {
        if (!ModelState.IsValid)
        {
            return View(body);
        }

        var roleName = "Pilot";
        
        var username = body.Username.Trim().ToLower();
        var user = _dbContext.Users.Include(u => u.Role).FirstOrDefault(u => u.UserName == username);
        var role = _dbContext.Roles.FirstOrDefault(r => r.Name == roleName);
        if (role is null)
        {
            role = new RoleTable { Name = roleName };
            _dbContext.Roles.Add(role);
        }
        
        if (user == null)
        {
            user = new UserTable
            {
                UserName = username,
                IsActive = true,
                Email = username,
                Role = role,
                RoleId = role.Id
            };

            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();
        }
        
        HttpContext.Session.SetString("Username", username);
        
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, username),
        };

        if (user.Role is {} r)
            claims.Add(new(ClaimTypes.Role, r.Name));
        
        var identity = new ClaimsIdentity(claims, "CookieAuth");
        var principal = new ClaimsPrincipal(identity);
        await HttpContext.SignInAsync("CookieAuth", principal);

        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    public IActionResult Logout()
    {
        HttpContext.SignOutAsync("CookieAuth");
        HttpContext.Session.Clear();

        return RedirectToAction("Index", "Home");
    }
    
    [HttpGet]
    public IActionResult AccessDenied()
    {
        return View();
    }
}
