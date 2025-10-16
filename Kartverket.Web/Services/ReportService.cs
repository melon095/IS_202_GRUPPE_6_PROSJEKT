using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Services;

public class ReportService
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
            Status = FeedbackStatus.Draft,
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
            .FirstOrDefaultAsync(r => r.Id == reportId && r.Status == FeedbackStatus.Draft, cancellationToken);
    }
}
