using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Kartverket.Web;

// @see https://jefclaes.be/2012/06/persisting-model-state-when-using-prg.html
// @see https://andrewlock.net/post-redirect-get-using-tempdata-in-asp-net-core/
// TODO: Kan bare serialisere string, https://source.dot.net/#Microsoft.AspNetCore.Mvc.ViewFeatures/Infrastructure/DefaultTempDataSerializer.cs,217

public class ExportModelStateAttribute : ActionFilterAttribute
{
    public override void OnActionExecuted(ActionExecutedContext context)
    {
        base.OnActionExecuted(context);
        if (context.Controller is not Controller c) return;
        if (c.ModelState.IsValid) return;

        // Hvis ModelState er ugyldig så lagrer vi det i TempData
        var serialisableErrors = c.ModelState
            .Where(x => x.Value.Errors.Any())
            .ToDictionary(
                kvp => kvp.Key,
                kvp => string.Join(Environment.NewLine, kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
            );

        c.TempData["ModelStateErrors"] = serialisableErrors;
    }
}

public class ImportModelStateAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        base.OnActionExecuting(context);
        // Hvis ModelState ikke finnes i TempData så gjør vi ingenting!

        if (context.Controller is not Controller c || !c.TempData.TryGetValue("ModelStateErrors", out var obj))
            return;

        if (obj is not Dictionary<string, string> serialisableErrors) return;

        foreach (var kvp in serialisableErrors)
            c.ModelState.AddModelError(kvp.Key, kvp.Value);

        c.TempData.Remove("ModelStateErrors");
    }
}
