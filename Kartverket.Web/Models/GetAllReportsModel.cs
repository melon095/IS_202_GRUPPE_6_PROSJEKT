using Kartverket.Web.Database.Tables;
// Modell for sending data to view

namespace Kartverket.Web.Models
{
    public class GetAllReportsModel
    {
        // List for reports
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
