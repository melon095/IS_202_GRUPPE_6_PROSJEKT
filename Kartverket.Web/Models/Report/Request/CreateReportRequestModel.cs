using System.ComponentModel.DataAnnotations;

namespace Kartverket.Web.Models.Report.Request;

public class CreateReportRequestModel
{
    [Required]
    public string Title { get; set; }
    
    [Required]
    public string Description { get; set; }
}
