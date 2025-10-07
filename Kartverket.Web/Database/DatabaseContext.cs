using Kartverket.Web.Database.Tables;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Kartverket.Web.Database;

public class DatabaseContext : IdentityDbContext<UserTable, RoleTable, Guid>
{
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
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
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
}