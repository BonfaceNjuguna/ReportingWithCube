using Microsoft.EntityFrameworkCore;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Data;

namespace ReportingWithCube.Services;

/// <summary>
/// Service for managing saved reports (CRUD operations)
/// Reports are stored configurations that run on live data
/// </summary>
public interface ISavedReportService
{
    Task<SavedReportDefinition> CreateAsync(SavedReportDefinition report);
    Task<SavedReportDefinition?> GetByIdAsync(int id, string userId);
    Task<IEnumerable<SavedReportDefinition>> GetByUserAsync(string userId);
    Task<SavedReportDefinition> UpdateAsync(SavedReportDefinition report);
    Task DeleteAsync(int id, string userId);
}

public class SavedReportService : ISavedReportService
{
    private readonly ReportingDbContext _context;
    private readonly ILogger<SavedReportService> _logger;

    public SavedReportService(ReportingDbContext context, ILogger<SavedReportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<SavedReportDefinition> CreateAsync(SavedReportDefinition report)
    {
        report.CreatedAt = DateTime.UtcNow;
        report.UpdatedAt = DateTime.UtcNow;

        _context.SavedReports.Add(report);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created saved report: {ReportName} for user: {UserId}", report.Name, report.UserId);
        return report;
    }

    public async Task<SavedReportDefinition?> GetByIdAsync(int id, string userId)
    {
        return await _context.SavedReports
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
    }

    public async Task<IEnumerable<SavedReportDefinition>> GetByUserAsync(string userId)
    {
        return await _context.SavedReports
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();
    }

    public async Task<SavedReportDefinition> UpdateAsync(SavedReportDefinition report)
    {
        var existing = await _context.SavedReports
            .FirstOrDefaultAsync(r => r.Id == report.Id && r.UserId == report.UserId);

        if (existing == null)
        {
            throw new InvalidOperationException($"Report {report.Id} not found for user {report.UserId}");
        }

        existing.Name = report.Name;
        existing.Dataset = report.Dataset;
        existing.Kpis = report.Kpis;
        existing.GroupBy = report.GroupBy;
        existing.Columns = report.Columns;
        existing.Filters = report.Filters;
        existing.Sort = report.Sort;
        existing.Charts = report.Charts;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated saved report: {ReportId}", report.Id);
        return existing;
    }

    public async Task DeleteAsync(int id, string userId)
    {
        var report = await _context.SavedReports
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (report != null)
        {
            _context.SavedReports.Remove(report);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted saved report: {ReportId}", id);
        }
    }
}

/// <summary>
/// Service for managing user dashboards
/// </summary>
public interface IDashboardService
{
    Task<DashboardDefinition> CreateAsync(DashboardDefinition dashboard);
    Task<DashboardDefinition?> GetByIdAsync(int id, string userId);
    Task<IEnumerable<DashboardDefinition>> GetByUserAsync(string userId);
    Task<DashboardDefinition> UpdateAsync(DashboardDefinition dashboard);
    Task DeleteAsync(int id, string userId);
}

public class DashboardService : IDashboardService
{
    private readonly ReportingDbContext _context;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(ReportingDbContext context, ILogger<DashboardService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DashboardDefinition> CreateAsync(DashboardDefinition dashboard)
    {
        dashboard.CreatedAt = DateTime.UtcNow;
        dashboard.UpdatedAt = DateTime.UtcNow;

        _context.Dashboards.Add(dashboard);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created dashboard: {DashboardName} for user: {UserId}", dashboard.Name, dashboard.UserId);
        return dashboard;
    }

    public async Task<DashboardDefinition?> GetByIdAsync(int id, string userId)
    {
        return await _context.Dashboards
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
    }

    public async Task<IEnumerable<DashboardDefinition>> GetByUserAsync(string userId)
    {
        return await _context.Dashboards
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync();
    }

    public async Task<DashboardDefinition> UpdateAsync(DashboardDefinition dashboard)
    {
        var existing = await _context.Dashboards
            .FirstOrDefaultAsync(d => d.Id == dashboard.Id && d.UserId == dashboard.UserId);

        if (existing == null)
        {
            throw new InvalidOperationException($"Dashboard {dashboard.Id} not found for user {dashboard.UserId}");
        }

        existing.Name = dashboard.Name;
        existing.Widgets = dashboard.Widgets;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated dashboard: {DashboardId}", dashboard.Id);
        return existing;
    }

    public async Task DeleteAsync(int id, string userId)
    {
        var dashboard = await _context.Dashboards
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (dashboard != null)
        {
            _context.Dashboards.Remove(dashboard);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted dashboard: {DashboardId}", id);
        }
    }
}
