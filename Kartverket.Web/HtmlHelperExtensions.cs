using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Text.Encodings.Web;

namespace Kartverket.Web;

// @see https://khalidabuhakmeh.com/more-http-methods-aspnet-core-html-forms

public static class HtmlHelperExtensions
{
    public const string HttpMethodOverrideField = "_method";

    public static IHtmlContent HttpMethodOverride(this IHtmlHelper htmlHelper, HttpMethod httpMethod)
    {
        var input = new TagBuilder("input");
        input.Attributes.Add("type", "hidden");
        input.Attributes.Add("name", HttpMethodOverrideField);
        input.Attributes.Add("value", httpMethod.ToString().ToUpper());

        using var writer = new StringWriter();
        input.WriteTo(writer, HtmlEncoder.Default);
        return new HtmlString(writer.ToString());
    }
}
