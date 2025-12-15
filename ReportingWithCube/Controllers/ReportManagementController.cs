using Microsoft.AspNetCore.Mvc;
using ReportingWithCube.Analytics.Models;
using ReportingWithCube.Services;

namespace ReportingWithCube.Controllers;

/// <summary>
/// Saved Reports and Dashboards Management
/// Handles CRUD operations for user-defined reports and dashboards
/// </summary>
[ApiController]
[Route("api/analytics/v1")]
public class ReportManagementController : ControllerBase
{
    private readonly ISavedReportService _savedReportService;
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<ReportManagementController> _logger;

    public ReportManagementController(
        ISavedReportService savedReportService,
        IDashboardService dashboardService,
        ILogger<ReportManagementController> logger)
    {
        _savedReportService = savedReportService;
        _dashboardService = dashboardService;
        _logger = logger;
    }

    // ===== SAVED REPORTS =====

    /// <summary>
    /// Get all saved reports for current user
    /// GET /api/analytics/v1/reports
    /// </summary>
    [HttpGet("reports")]
    public async Task<ActionResult<IEnumerable<SavedReportDefinition>>> GetSavedReports()
    {
        var userId = GetCurrentUserId();
        var reports = await _savedReportService.GetByUserAsync(userId);
        return Ok(reports);
    }

    /// <summary>
    /// Get a specific saved report
    /// GET /api/analytics/v1/reports/{id}
    /// </summary>
    [HttpGet("reports/{id}")]
    public async Task<ActionResult<SavedReportDefinition>> GetSavedReport(int id)
    {
        var userId = GetCurrentUserId();
        var report = await _savedReportService.GetByIdAsync(id, userId);
        
        if (report == null)
        {
            return NotFound(new { error = $"Report {id} not found" });
        }

        return Ok(report);
    }

    /// <summary>
    /// Create a new saved report
    /// POST /api/analytics/v1/reports
    /// Example: Save "RFQ Jan by MÖCHEL" with filters and column selection
    /// </summary>
    [HttpPost("reports")]
    public async Task<ActionResult<SavedReportDefinition>> CreateSavedReport([FromBody] SavedReportDefinition report)
    {
        try
        {
            report.UserId = GetCurrentUserId();
            var created = await _savedReportService.CreateAsync(report);
            return CreatedAtAction(nameof(GetSavedReport), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating saved report");
            return StatusCode(500, new { error = "Failed to create report" });
        }
    }

    /// <summary>
    /// Update a saved report
    /// PUT /api/analytics/v1/reports/{id}
    /// </summary>
    [HttpPut("reports/{id}")]
    public async Task<ActionResult<SavedReportDefinition>> UpdateSavedReport(int id, [FromBody] SavedReportDefinition report)
    {
        try
        {
            report.Id = id;
            report.UserId = GetCurrentUserId();
            var updated = await _savedReportService.UpdateAsync(report);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating saved report");
            return StatusCode(500, new { error = "Failed to update report" });
        }
    }

    /// <summary>
    /// Delete a saved report
    /// DELETE /api/analytics/v1/reports/{id}
    /// </summary>
    [HttpDelete("reports/{id}")]
    public async Task<ActionResult> DeleteSavedReport(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _savedReportService.DeleteAsync(id, userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting saved report");
            return StatusCode(500, new { error = "Failed to delete report" });
        }
    }

    // ===== DASHBOARDS =====

    /// <summary>
    /// Get all dashboards for current user
    /// GET /api/analytics/v1/dashboards
    /// </summary>
    [HttpGet("dashboards")]
    public async Task<ActionResult<IEnumerable<DashboardDefinition>>> GetDashboards()
    {
        var userId = GetCurrentUserId();
        var dashboards = await _dashboardService.GetByUserAsync(userId);
        return Ok(dashboards);
    }

    /// <summary>
    /// Get a specific dashboard
    /// GET /api/analytics/v1/dashboards/{id}
    /// </summary>
    [HttpGet("dashboards/{id}")]
    public async Task<ActionResult<DashboardDefinition>> GetDashboard(int id)
    {
        var userId = GetCurrentUserId();
        var dashboard = await _dashboardService.GetByIdAsync(id, userId);
        
        if (dashboard == null)
        {
            return NotFound(new { error = $"Dashboard {id} not found" });
        }

        return Ok(dashboard);
    }

    /// <summary>
    /// Create a new dashboard
    /// POST /api/analytics/v1/dashboards
    /// </summary>
    [HttpPost("dashboards")]
    public async Task<ActionResult<DashboardDefinition>> CreateDashboard([FromBody] DashboardDefinition dashboard)
    {
        try
        {
            dashboard.UserId = GetCurrentUserId();
            var created = await _dashboardService.CreateAsync(dashboard);
            return CreatedAtAction(nameof(GetDashboard), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating dashboard");
            return StatusCode(500, new { error = "Failed to create dashboard" });
        }
    }

    /// <summary>
    /// Update a dashboard
    /// PUT /api/analytics/v1/dashboards/{id}
    /// </summary>
    [HttpPut("dashboards/{id}")]
    public async Task<ActionResult<DashboardDefinition>> UpdateDashboard(int id, [FromBody] DashboardDefinition dashboard)
    {
        try
        {
            dashboard.Id = id;
            dashboard.UserId = GetCurrentUserId();
            var updated = await _dashboardService.UpdateAsync(dashboard);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating dashboard");
            return StatusCode(500, new { error = "Failed to update dashboard" });
        }
    }

    /// <summary>
    /// Delete a dashboard
    /// DELETE /api/analytics/v1/dashboards/{id}
    /// </summary>
    [HttpDelete("dashboards/{id}")]
    public async Task<ActionResult> DeleteDashboard(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _dashboardService.DeleteAsync(id, userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting dashboard");
            return StatusCode(500, new { error = "Failed to delete dashboard" });
        }
    }

    private string GetCurrentUserId()
    {
        // TODO: Extract from claims/JWT token when authentication is implemented
        return User.Identity?.Name ?? "test-user";
    }
}
