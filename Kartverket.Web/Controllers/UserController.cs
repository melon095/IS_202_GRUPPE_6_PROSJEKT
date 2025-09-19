using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Microsoft.AspNetCore.Mvc;

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
    public IActionResult Login(string username)
    {
        var user = _dbContext.Users.FirstOrDefault(u => u.UserName == username);
        if (user == null)
        {
            user = new UserTable { UserName = username, IsActive = true, Email = username };
            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();
        }
        
        HttpContext.Session.SetString("Username", username);

        return RedirectToAction("Index", "Home");
    }
}