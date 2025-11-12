using System.ComponentModel.DataAnnotations;

namespace Kartverket.Web.Database;

public enum ReviewStatus
{
    [Display(Name = "Utkast")]
    Draft,
    [Display(Name = "Uåpnet")]
    Submitted,
    [Display(Name = "Godkjent")]
    Resolved,
    [Display(Name = "Avslått")]
    Closed
}
