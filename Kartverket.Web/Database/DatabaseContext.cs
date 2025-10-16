using Kartverket.Web.Database.Tables;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Kartverket.Web.Database;

public class DatabaseContext : IdentityDbContext<UserTable, RoleTable, Guid>, IUnitOfWork
{
    private IDbContextTransaction? _transaction;

    public DbSet<RoleTable> Roles { get; set; }

    public DbSet<ReportTable> Reports { get; set; }
    public DbSet<ReportFeedbackTable> ReportFeedbacks { get; set; }

    public DbSet<HindranceObjectTable> HindranceObjects { get; set; }
    public DbSet<HindranceTypeTable> HindranceTypes { get; set; }
    public DbSet<HindrancePointTable> HindrancePoints { get; set; }

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

        modelBuilder.Entity<HindranceTypeTable>()
            .HasIndex(mot => mot.Name)
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

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null)
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

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null)
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
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
            if (entry.Entity is BaseModel baseModel)
            {
                baseModel.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    baseModel.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.Entity is UserTable user)
            {
                user.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    user.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.Entity is RoleTable role)
            {
                role.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    role.CreatedAt = DateTime.UtcNow;
            }
    }
}
