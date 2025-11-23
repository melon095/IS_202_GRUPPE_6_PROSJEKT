using Kartverket.Web.AuthPolicy;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Models.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Controllers;

public class UserController : Controller
{
    private readonly ILogger<UserController> _logger;
    private readonly UserManager<UserTable> _userManager;
    private readonly SignInManager<UserTable> _signInManager;
    private readonly RoleManager<RoleTable> _roleManager;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserController(ILogger<UserController> logger,
        UserManager<UserTable> userManager,
        SignInManager<UserTable> signInManager,
        RoleManager<RoleTable> roleManager,
        IHttpContextAccessor httpContextAccessor)
    {
        _logger = logger;
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    ///     Viser innloggingssiden.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Login(string? returnUrl = null)
    {
        UserLoginRequestModel model = new();
        ViewData["ReturnUrl"] = returnUrl;

        return View(model);
    }

    /// <summary>
    ///     Viser tilgang nektet-siden.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public IActionResult AccessDenied() => View();

    /// <summary>
    ///     Logger ut brukeren.
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        _httpContextAccessor.HttpContext?.Session.Clear();

        return RedirectToAction("Index", "Home");
    }

    /// <summary>
    ///     Viser registreringssiden.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Register() => View();

    /// <summary>
    ///     Logger inn brukeren.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Login(UserLoginRequestModel body, string? returnUrl = null)
    {
        if (!ModelState.IsValid)
            return View(body);

        returnUrl ??= Url.Content("~/");

        var user = await _userManager.FindByNameAsync(body.Username);
        if (user == null)
        {
            ModelState.AddModelError(string.Empty, "Ugyldig brukernavn eller passord.");

            return View(body);
        }

        var result = await _signInManager.PasswordSignInAsync(body.Username, body.Password, body.RememberMe, false);
        if (!result.Succeeded)
        {
            ModelState.AddModelError(string.Empty, "Ugyldig brukernavn eller passord.");

            return View(body);
        }

        _httpContextAccessor.HttpContext?.Session.SetString("Username", body.Username);
        _httpContextAccessor.HttpContext?.Session.SetString("UserId", user.Id.ToString());

        _logger.LogInformation("Bruker {Username} logget inn.", body.Username);
        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            return LocalRedirect(returnUrl);

        return RedirectToAction("Index", "Home");
    }

    /// <summary>
    ///     Registrerer en ny bruker.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(UserRegisterRequestModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        var role = await _roleManager.FindByNameAsync(RoleValue.User);
        if (role == null)
        {
            ModelState.AddModelError(string.Empty, "Standardrolle ikke funnet.");
            return View(model);
        }

        var user = new UserTable
        {
            UserName = model.Username,
            IsActive = true,
            RoleId = role.Id
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors) ModelState.AddModelError(string.Empty, error.Description);

            return View(model);
        }

        await _userManager.AddToRoleAsync(user, RoleValue.User);
        await _signInManager.SignInAsync(user, false);

        _logger.LogInformation("Bruker {Username} opprettet en ny konto.", model.Username);

        _httpContextAccessor.HttpContext?.Session.SetString("Username", model.Username);
        _httpContextAccessor.HttpContext?.Session.SetString("UserId", user.Id.ToString());

        return RedirectToAction("Index", "Home");
    }

    /// <summary>
    ///     Endrer rollen til den innloggede brukeren.
    /// </summary>
    [HttpGet("User/SetRole/{role}")]
    [Authorize(Policy = RoleValue.AtLeastUser)]
    public async Task<IActionResult> SetRole([FromRoute] string role)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return NotFound();

        var newRole = await _roleManager.FindByNameAsync(role);
        if (newRole == null)
            return NotFound();

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, role);

        user.RoleId = newRole.Id;
        await _userManager.UpdateAsync(user);

        await _signInManager.SignInAsync(user, false);

        return RedirectToAction("Index", "Home");
    }
}
