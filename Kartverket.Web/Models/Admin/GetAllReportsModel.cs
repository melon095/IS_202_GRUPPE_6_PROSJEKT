using Kartverket.Web.Controllers;
using Kartverket.Web.Database;


namespace Kartverket.Web.Models.Admin
{

    public class GetAllReportsModel
    {
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public DateOnly SortDate { get; set; }
        public ReviewStatus? SortStatus { get; set; }
        // List of reports
        public List<MakeReportList> Reports { get; set; } = [];
        public class MakeReportList
        {
            public Guid Id { get; set; }
            public string User { get; set; }
            public string Title { get; set; }
            public DateTime CreatedAt { get; set; }
            public ReviewStatus Review { get; set; }

            public int TotalObjects { get; set; }

        }
    }
}
