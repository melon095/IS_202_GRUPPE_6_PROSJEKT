using Kartverket.Web.Database.Tables;

namespace Kartverket.Web.Models.Report.Response;

public class GetReportsModel
{
    public List<ReportTable> Reports { get; set; } = [];
}