namespace Kartverket.Web.Models.Report.Response
{
    public struct Point
    {
        public Guid Id { get; set; }
        public double Lat { get; set; }
        public double Lng { get; set; }
        public double Elevation { get; set; }
    }
}
