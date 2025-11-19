using EntityFrameworkCore.Testing.NSubstitute;
using Kartverket.Web.Database;
using Kartverket.Web.Database.Tables;
using Kartverket.Web.Services;
using NSubstitute;
using Xunit;

namespace Kartverket.Web.Tests;

public class ReportServiceTests
{
    private readonly DatabaseContext _dbContext;

    public ReportServiceTests()
    {
        _dbContext = Create.MockedDbContextFor<DatabaseContext>();
    }

    [Fact]
    public async Task CreateDraft_ValidReport_Succeeds()
    {
        var service = new ReportService(_dbContext);
        var reportedById = Guid.NewGuid();

        var report = await service.CreateDraft(reportedById);

        Assert.NotNull(report);
        Assert.Equal(reportedById, report.ReportedById);
        await _dbContext.Received().Reports.AddAsync(report, Arg.Any<CancellationToken>());
    }

    [Fact]
    public void FinaliseReport_ValidReport_Succeeds()
    {
        var service = new ReportService(_dbContext);
        var report = new ReportTable
        {
            Id = Guid.NewGuid(),
            Title = "Draft Report",
            Description = "Draft Description",
            ReviewStatus = ReviewStatus.Draft
        };
        var newTitle = "Final Report";
        var newDescription = "Final Description";

        service.FinaliseReport(report, newTitle, newDescription);

        Assert.Equal(newTitle, report.Title);
        Assert.Equal(newDescription, report.Description);
        Assert.Equal(ReviewStatus.Submitted, report.ReviewStatus);
    }
}
