using System.ComponentModel.DataAnnotations;

namespace Kartverket.Web.Models.Map.Request;

public class UploadMapDataModel
{
    [Required, MinLength(1), MaxLength(100)]
    public string ReportTitle { get; set; }
    
    [Required, MinLength(1), MaxLength(500)]
    public string ReportDescription { get; set; }
    
    public List<Point> Points { get; set; } = [];
    
    public class Point
    {
        [Required]
        public double Lat { get; set; }
        [Required]
        public double Lng { get; set; }
        [Required]
        public int Elevation { get; set; }
    }
    
    public class ReportObject
    {

    }
}
