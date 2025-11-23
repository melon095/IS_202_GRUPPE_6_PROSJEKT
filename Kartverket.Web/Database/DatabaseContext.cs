using Kartverket.Web.Database.Tables;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Kartverket.Web.Database;

public class DatabaseContext : IdentityDbContext<UserTable, RoleTable, Guid>, IUnitOfWork
{
    private IDbContextTransaction? _transaction;

    public virtual DbSet<ReportTable> Reports { get; set; }
    public virtual DbSet<ReportFeedbackTable> ReportFeedbacks { get; set; }

    public virtual DbSet<HindranceObjectTable> HindranceObjects { get; set; }
    public virtual DbSet<HindranceTypeTable> HindranceTypes { get; set; }
    public virtual DbSet<HindrancePointTable> HindrancePoints { get; set; }

    public DbContext Context => this;

    public DatabaseContext()
    {
    }

    public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserTable>()
            .HasIndex(u => u.UserName)
            .IsUnique();

        modelBuilder.Entity<UserTable>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<UserTable>()
            .HasMany(u => u.Reports)
            .WithOne(r => r.ReportedBy)
            .HasForeignKey(r => r.ReportedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserTable>()
            .HasMany(u => u.ReportFeedbacks)
            .WithOne(rf => rf.FeedbackBy)
            .HasForeignKey(rf => rf.FeedbackById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RoleTable>()
            .HasIndex(r => r.Name)
            .IsUnique();

        modelBuilder.Entity<ReportTable>()
            .HasOne(r => r.ReportedBy)
            .WithMany(u => u.Reports)
            .HasForeignKey(r => r.ReportedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ReportTable>()
            .HasMany(r => r.HindranceObjects)
            .WithOne(mo => mo.Report)
            .HasForeignKey(mo => mo.ReportId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReportTable>()
            .HasMany(r => r.Feedbacks)
            .WithOne(rf => rf.Report)
            .HasForeignKey(rf => rf.ReportId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReportFeedbackTable>()
            .HasOne(rf => rf.Report);

        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();

        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();

        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    ///     Begynner en database transaksjon.
    /// </summary>
    public Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
            return Task.CompletedTask;

        var strategy = Database.CreateExecutionStrategy();
        return strategy.ExecuteAsync(async () =>
        {
            var transaction = await Database.BeginTransactionAsync(cancellationToken);
            _transaction = transaction;
        });
    }

    /// <summary>
    ///     Committer en database transaksjon.
    /// </summary>
    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
            return;

        try
        {
            await SaveChangesAsync(cancellationToken);
            await _transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    /// <summary>
    ///     Ruller tilbake en database transaksjon.
    /// </summary>
    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
            return;

        try
        {
            await _transaction.RollbackAsync(cancellationToken);
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    /// <inheritdoc />
    public Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default)
    {
        var strategy = Database.CreateExecutionStrategy();

        return strategy.ExecuteAsync(async () =>
        {
            await BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await operation();
                await CommitTransactionAsync(cancellationToken);

                return result;
            }
            catch
            {
                await RollbackTransactionAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <inheritdoc />
    public Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default)
    {
        var strategy = Database.CreateExecutionStrategy();

        return strategy.ExecuteAsync(async () =>
        {
            await BeginTransactionAsync(cancellationToken);
            try
            {
                await operation();
                await CommitTransactionAsync(cancellationToken);
            }
            catch
            {
                await RollbackTransactionAsync(cancellationToken);
                throw;
            }
        });
    }

    private void UpdateTimestamps()
    {
        if (Database.IsInMemory())
            return;

        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
            switch (entry.Entity)
            {
                case BaseModel baseModel:
                {
                    baseModel.UpdatedAt = DateTime.UtcNow;
                    if (entry.State == EntityState.Added)
                        baseModel.CreatedAt = DateTime.UtcNow;
                    break;
                }
                case UserTable user:
                {
                    user.UpdatedAt = DateTime.UtcNow;
                    if (entry.State == EntityState.Added)
                        user.CreatedAt = DateTime.UtcNow;
                    break;
                }
                case RoleTable role:
                {
                    role.UpdatedAt = DateTime.UtcNow;
                    if (entry.State == EntityState.Added)
                        role.CreatedAt = DateTime.UtcNow;
                    break;
                }
            }
    }
}
