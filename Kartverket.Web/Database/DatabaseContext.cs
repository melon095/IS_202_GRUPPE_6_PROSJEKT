using Kartverket.Web.Database.Tables;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Database;

public class DatabaseContext : DbContext
{
    public DbSet<UserTable> Users { get; set; }
    public DbSet<RoleTable> Roles { get; set; }
    
    public DbSet<ReportTable> Reports { get; set; }
    public DbSet<ReportFeedbackTable> ReportFeedbacks { get; set; }
    public DbSet<ReportFeedbackAssignmentTable> ReportFeedbackAssignments { get; set; }
    
    public DbSet<MapObjectTable> MapObjects { get; set; }
    public DbSet<MapObjectTypeTable> MapObjectTypes { get; set; }
    public DbSet<MapPointTable> MapPoints { get; set; }
    
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
        
        modelBuilder.Entity<RoleTable>()
            .HasIndex(r => r.Name)
            .IsUnique();
        
        modelBuilder.Entity<MapObjectTypeTable>()
            .HasIndex(mot => mot.Name)
            .IsUnique();

        modelBuilder.Entity<ReportFeedbackAssignmentTable>()
            .HasOne(rfa => rfa.User)
            .WithMany(u => u.ReportFeedbackAssignments)
            .HasForeignKey(rfa => rfa.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<ReportTable>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reports)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<ReportFeedbackTable>()
            .HasOne(rf => rf.Report)
            .WithOne(r => r.Feedback)
            .HasForeignKey<ReportTable>(r => r.FeedbackId)
            .OnDelete(DeleteBehavior.Cascade);
        
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
    
    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e is { Entity: BaseModel, State: EntityState.Added or EntityState.Modified });

        foreach (var entry in entries)
        {
            var entity = (BaseModel)entry.Entity;
            entity.UpdatedAt = DateTime.UtcNow;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
            }
        }
    }
}