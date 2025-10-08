using Kartverket.Web.AuthPolicy;
using System.Security.Claims;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.User.Request;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Controllers;

public class UserController : Controller
{
    private readonly ILogger<UserController> _logger;
    private readonly DatabaseContext _dbContext;
    private readonly UserManager<UserTable> _userManager;
    private readonly SignInManager<UserTable> _signInManager;
    private readonly RoleManager<RoleTable> _roleManager;
    private readonly IHttpContextAccessor _httpContextAccessor;
    
    public UserController(ILogger<UserController> logger,
        DatabaseContext dbContext,
        UserManager<UserTable> userManager,
        SignInManager<UserTable> signInManager,
        RoleManager<RoleTable> roleManager,
        IHttpContextAccessor httpContextAccessor)
    {
        _logger = logger;
        _dbContext = dbContext;
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _httpContextAccessor = httpContextAccessor;
    }
    
    [HttpGet, AllowAnonymous]
    public IActionResult Login(string? returnUrl = null)
    {
        UserLoginRequestModel model = new()
        {
            ReturnUrl = returnUrl ?? Url.Content("~/")
        };
        
        return View(model);
    }
    
    [HttpGet]
    public IActionResult AccessDenied()
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
    
    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost, AllowAnonymous]
    public async Task<IActionResult> Login(UserLoginRequestModel body)
    {
        if (!ModelState.IsValid)
        {
            return View(body);
        }
        
        var user = await _userManager.FindByNameAsync(body.Username);
        if (user == null)
        {
            ModelState.AddModelError(string.Empty, "Ugyldig brukernavn eller passord.");
            return View(body);
        }
        
        var result = await _signInManager.PasswordSignInAsync(body.Username, body.Password, false, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            ModelState.AddModelError(string.Empty, "Ugyldig brukernavn eller passord.");
            return View(body);
        }
        
        if (result.IsLockedOut)
        {
            _logger.LogWarning("Bruker {Username} er låst ute.", body.Username);
            return View("Lockout");
        }
        
        _httpContextAccessor.HttpContext.Session.SetString("Username", body.Username);
        _httpContextAccessor.HttpContext.Session.SetString("UserId", user.Id.ToString());

        _logger.LogInformation("Bruker {Username} logget inn.", body.Username);
        if (!string.IsNullOrEmpty(body.ReturnUrl) && Url.IsLocalUrl(body.ReturnUrl))
        {
            return LocalRedirect(body.ReturnUrl);
        }

        return RedirectToAction("Index", "Home");
    }

    [HttpPost, AllowAnonymous, ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(UserRegisterRequestModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        var user = new UserTable
        {
            UserName = model.Username,
            IsActive = true,
        };
        
        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        
            return View(model);
        }
        
        if ((await _roleManager.RoleExistsAsync(RoleValue.User)) == false)
        {
            var role = new RoleTable()
            {
                Name = RoleValue.User
            };
        
            await _roleManager.CreateAsync(role);
        }
        
        await _userManager.AddToRoleAsync(user, RoleValue.User);
        await _signInManager.SignInAsync(user, isPersistent: false);
        
        _logger.LogInformation("Bruker {Username} opprettet en ny konto.", model.Username);
        
        _httpContextAccessor.HttpContext.Session.SetString("Username", model.Username);
        _httpContextAccessor.HttpContext.Session.SetString("UserId", user.Id.ToString());
        
        return RedirectToAction("Index", "Home");
    }
}
