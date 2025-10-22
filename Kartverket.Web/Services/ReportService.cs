using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Services;

public interface IReportService
{
    Task<ReportTable> CreateDraft(Guid reportedById, CancellationToken cancellationToken = default);
    Task<ReportTable?> GetDraft(Guid reportId, CancellationToken cancellationToken = default);
    void FinaliseReport(ReportTable report, string title, string description);

    Task<List<ReportTable>> GetReportsByReviewStatus(ReviewStatus status,
        CancellationToken cancellationToken = default);

    Task<List<ReportTable>> GetReportsByFeedbackType(FeedbackType type,
        CancellationToken cancellationToken = default);
}

public class ReportService : IReportService
{
    private readonly ILogger<ReportService> _logger;
    private readonly DatabaseContext _dbContext;

    public ReportService(ILogger<ReportService> logger, DatabaseContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    public async Task<ReportTable> CreateDraft(Guid reportedById, CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Creating draft report for user {UserId}", reportedById);

        var report = new ReportTable
        {
            Id = Guid.NewGuid(),
            Title = $"Utkast Rapport - {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
            Description = "",
            ReviewStatus = ReviewStatus.Draft,
            ReportedById = reportedById
        };

        await _dbContext.Reports.AddAsync(report, cancellationToken);

        return report;
    }

    public async Task<ReportTable?> GetDraft(Guid reportId, CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Fetching draft report {ReportId}", reportId);

        return await _dbContext.Reports
            .Include(r => r.ReportedBy)
            .Include(r => r.HindranceObjects)
            .ThenInclude(ho => ho.HindrancePoints)
            .Include(r => r.HindranceObjects)
            .ThenInclude(ho => ho.HindranceType)
            .FirstOrDefaultAsync(r => r.Id == reportId && r.ReviewStatus == ReviewStatus.Draft, cancellationToken);
    }

    public void FinaliseReport(ReportTable report, string title, string description)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Finalising report {ReportId}", report.Id);

        report.Title = title;
        report.Description = description;
        report.ReviewStatus = ReviewStatus.Submitted;
    }

    public async Task<List<ReportTable>> GetReportsByReviewStatus(ReviewStatus status,
        CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Fetching reports with feedback status {Status}", status);

        return await _dbContext.Reports
            .Include(r => r.ReportedBy)
            .Where(r => r.ReviewStatus == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ReportTable>> GetReportsByFeedbackType(FeedbackType type,
        CancellationToken cancellationToken = default)
    {
        if (_logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug("Fetching reports with feedback type {Type}", type);

        return await _dbContext.Reports
            .Include(r => r.ReportedBy)
            .Where(r => r.Feedbacks.Any(f => f.FeedbackType == type))
            .ToListAsync(cancellationToken);
    }
}
