namespace Kartverket.Web.Models;

public record IndexModelPoint(double Latitude, double Longitude);

public record IndexModel(List<IndexModelPoint> Points);