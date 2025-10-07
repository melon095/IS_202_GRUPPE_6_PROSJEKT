namespace Kartverket.Web.Models
{
    public class GetAllReportsModel
    {
        // List of reports
        public List<MakeReportList> Reports { get; set; } = [];
        public class MakeReportList
        {
            public Guid Id { get; set; }
            public string User { get; set; }
            public string Title { get; set; }
            public DateTime CreatedAt { get; set; }
        }
    }
}
