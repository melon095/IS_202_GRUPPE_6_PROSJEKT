using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Services;

public interface IReportService
{
    /// <summary>
    ///     Lager et nytt utkast til rapport
    /// </summary>
    /// <param name="reportedById">Id til brukeren som lager rapporten</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Den nye rapporten</returns>
    Task<ReportTable> CreateDraft(Guid reportedById, CancellationToken cancellationToken = default);


    /// <summary>
    ///     Henter et utkast til rapport basert på rapport Id
    /// </summary>
    /// <param name="reportId">Id til rapporten</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Rapporten hvis den finnes, ellers null</returns>
    Task<ReportTable?> GetDraft(Guid reportId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Fullfører en rapport ved å sette tittel, beskrivelse og endre status fra utkast til sendt inn
    /// </summary>
    /// <param name="report">Rapporten som skal fullføres</param>
    /// <param name="title">Tittel til rapporten</param>
    /// <param name="description">Beskrivelse til rapporten</param>
    void FinaliseReport(ReportTable report, string title, string description);

    /// <summary>
    ///     Henter rapporter basert på gjennomgangsstatus
    /// </summary>
    /// <param name="status">Gjennomgangsstatusen</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Liste over rapporter med den angitte gjennomgangsstatusen</returns>
    Task<List<ReportTable>> GetReportsByReviewStatus(ReviewStatus status,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Henter rapporter basert på tilbakemeldingstype
    /// </summary>
    /// <param name="type">Tilbakemeldingstypen</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Liste over rapporter med den angitte tilbakemeldingstypen</returns>
    Task<List<ReportTable>> GetReportsByFeedbackType(FeedbackType type,
        CancellationToken cancellationToken = default);
}

public class ReportService : IReportService
{
    private readonly DatabaseContext _dbContext;

    public ReportService(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<ReportTable> CreateDraft(Guid reportedById, CancellationToken cancellationToken = default)
    {
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

    /// <inheritdoc />
    public async Task<ReportTable?> GetDraft(Guid reportId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Reports
            .Include(r => r.ReportedBy)
            .Include(r => r.HindranceObjects)
            .ThenInclude(ho => ho.HindrancePoints)
            .Include(r => r.HindranceObjects)
            .ThenInclude(ho => ho.HindranceType)
            .FirstOrDefaultAsync(r => r.Id == reportId && r.ReviewStatus == ReviewStatus.Draft, cancellationToken);
    }

    /// <inheritdoc />
    public void FinaliseReport(ReportTable report, string title, string description)
    {
        report.Title = title;
        report.Description = description;
        report.ReviewStatus = ReviewStatus.Submitted;
    }

    /// <inheritdoc />
    public async Task<List<ReportTable>> GetReportsByReviewStatus(ReviewStatus status,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Reports
            .Include(r => r.ReportedBy)
            .Where(r => r.ReviewStatus == status)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<List<ReportTable>> GetReportsByFeedbackType(FeedbackType type,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Reports
            .Include(r => r.ReportedBy)
            .Where(r => r.Feedbacks.Any(f => f.FeedbackType == type))
            .ToListAsync(cancellationToken);
    }
}
