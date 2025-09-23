using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models
{
    public class GetAllReportsModel
    {
        public List<MakeReportList> Reports { get; set; } = [];
        public class MakeReportList
        {
            public string User { get; set; }
            public string Title { get; set; }
            public DateTime CreatedAt { get; set; }
        }
    }
}
