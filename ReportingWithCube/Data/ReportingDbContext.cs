using Microsoft.EntityFrameworkCore;
using ReportingWithCube.Analytics.Models;

namespace ReportingWithCube.Data;

/// <summary>
/// Database context for the reporting system
/// Cube.js connects directly to the PostgreSQL database (buyer_d_rfq_service_db)
/// This context is only for managing saved reports and dashboards
/// </summary>
public class ReportingDbContext : DbContext
{
    public ReportingDbContext(DbContextOptions<ReportingDbContext> options) : base(options)
    {
    }
    
    // Saved reports and dashboards
    public DbSet<SavedReportDefinition> SavedReports { get; set; }
    public DbSet<DashboardDefinition> Dashboards { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SavedReportDefinition configuration
        modelBuilder.Entity<SavedReportDefinition>(entity =>
        {
            entity.ToTable("SavedReports");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ObjectType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Dataset).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Kpis).HasColumnType("jsonb");
            entity.Property(e => e.GroupBy).HasColumnType("jsonb");
            entity.Property(e => e.Columns).HasColumnType("jsonb");
            entity.Property(e => e.Filters).HasColumnType("jsonb");
            entity.Property(e => e.Sort).HasColumnType("jsonb");
            entity.Property(e => e.Charts).HasColumnType("jsonb");

            entity.HasIndex(e => new { e.UserId, e.Name });
            entity.HasIndex(e => e.ObjectType);
        });

        // DashboardDefinition configuration
        modelBuilder.Entity<DashboardDefinition>(entity =>
        {
            entity.ToTable("Dashboards");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Widgets).HasColumnType("jsonb");

            entity.HasIndex(e => e.UserId);
        });
    }
}
