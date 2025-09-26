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

    [HttpGet]
    public IActionResult Logout()
    {
        HttpContext.SignOutAsync("CookieAuth");
        HttpContext.Session.Clear();

        return RedirectToAction("Index", "Home");
    }
    
    [HttpPost]
    public async Task<IActionResult> Login(UserLoginRequestModel body)
    {
        var username = body.Username?.Trim();
        if (string.IsNullOrEmpty(username))
        {
            ModelState.AddModelError("Username", "Username is required");
            return View();
        }

        var user = _dbContext.Users.Include(u => u.Role).FirstOrDefault(u => u.UserName == username);
        var role = _dbContext.Roles.FirstOrDefault(r => r.Name == "User");
        if (role is null)
        {
            role = new RoleTable { Name = "User" };
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
}
