using Kartverket.Web.Database;
using Kartverket.Web.Models.Report.Response;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Models.Report;

public class ReportDetailsViewModel
{
    [FromRoute] public Guid ReportId { get; set; }
    [FromRoute] public Guid? ObjectId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public ObjectDataModel? SelectedObject { get; set; }

    public List<ObjectDataModel> Objects { get; set; } = [];

    public class ObjectDataModel
    {
        public Guid Id { get; set; }
        public Point? CentroidPoint { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }

        public ReviewStatus ObjectStatus { get; set; }
        public Point[] Points { get; set; } = [];

        public DateTime? VerifiedAt { get; set; }
        public bool IsVerified => VerifiedAt.HasValue;
    }
}
