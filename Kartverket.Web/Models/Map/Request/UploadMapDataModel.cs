using System.ComponentModel.DataAnnotations;

namespace Kartverket.Web.Models.Map.Request;

public class UploadMapDataModel
{
    [Required]
    [MinLength(3, ErrorMessage = "Tittel må være minst 3 tegn")]
    [MaxLength(100, ErrorMessage = "Tittel kan være maks 100 tegn")]
    public string ReportTitle { get; set; }

    [Required]
    [MaxLength(500, ErrorMessage = "Beskrivelse kan være maks 500 tegn")]
    public string ReportDescription { get; set; } = "";
    
    public List<Point> Points { get; set; } = [];
    
    public class Point
    {
        [Required, Range(-90, 90, ErrorMessage = "Latitude må være mellom -90 og 90")]
        public double Lat { get; set; }
        [Required, Range(-180, 180, ErrorMessage = "Longitude må være mellom -180 og 180")]
        public double Lng { get; set; }
        [Required, Range(-430, 8850, ErrorMessage = "Elevation må være mellom -430 og 8850")]
        public int Elevation { get; set; }
    }
}
