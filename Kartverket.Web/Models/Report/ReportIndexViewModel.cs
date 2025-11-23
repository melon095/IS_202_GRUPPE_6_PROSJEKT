using Kartverket.Web.Database;
using Microsoft.AspNetCore.Mvc;

namespace Kartverket.Web.Models.Report;

/// <summary>
///     Sorteringsrekkefølge for rapporter.
/// </summary>
public enum SortOrder
{
    Ascending,
    Descending
}

/// <summary>
///     ViewModel for rapportindekssiden.
/// </summary>
public class ReportIndexViewModel
{
    [FromQuery] public int Page { get; set; } = 1;
    [FromQuery] public DateOnly SortDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    [FromQuery] public ReviewStatus? SortStatus { get; set; } = null;
    [FromQuery] public SortOrder SortOrder { get; set; } = SortOrder.Descending;

    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public List<Report> Reports { get; set; } = [];

    public class Report
    {
        public Guid Id { get; set; }
        public string User { get; set; }
        public string Title { get; set; }
        public DateTime CreatedAt { get; set; }
        public ReviewStatus Review { get; set; }
        public int TotalObjects { get; set; }
    }
}
