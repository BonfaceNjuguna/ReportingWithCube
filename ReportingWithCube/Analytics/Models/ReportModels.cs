namespace ReportingWithCube.Analytics.Models;

/// <summary>
/// Saved report definition - stores user's custom report configuration
/// </summary>
public class SavedReportDefinition
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string ObjectType { get; set; } = string.Empty; // "events", "suppliers", "items"
    public string Dataset { get; set; } = string.Empty;
    public string[] Kpis { get; set; } = Array.Empty<string>();
    public string[] GroupBy { get; set; } = Array.Empty<string>();
    public string[] Columns { get; set; } = Array.Empty<string>(); // Visible columns
    public UiFilter[] Filters { get; set; } = Array.Empty<UiFilter>();
    public UiSort? Sort { get; set; }
    public ChartConfiguration[] Charts { get; set; } = Array.Empty<ChartConfiguration>();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Chart configuration for dashboard
/// </summary>
public class ChartConfiguration
{
    public string Type { get; set; } = string.Empty; // "bar", "line", "pie", "area"
    public string Title { get; set; } = string.Empty;
    public string[] Kpis { get; set; } = Array.Empty<string>();
    public string? GroupBy { get; set; }
    public string? TimeDimension { get; set; }
}

/// <summary>
/// Extended filter with AND/OR logic support
/// </summary>
public class ComplexFilter
{
    public string Logic { get; set; } = "AND"; // "AND" or "OR"
    public FilterCondition[] Conditions { get; set; } = Array.Empty<FilterCondition>();
}

public class FilterCondition
{
    public string Field { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty;
    public object Value { get; set; } = null!;
}

/// <summary>
/// Report execution request with saved report
/// </summary>
public class ExecuteReportRequest
{
    public int? SavedReportId { get; set; }
    public UiQueryRequest? AdHocQuery { get; set; }
    public Dictionary<string, object>? RuntimeFilters { get; set; } // Override filters at runtime
}

/// <summary>
/// Drill-down request
/// </summary>
public class DrillDownRequest
{
    public string Dataset { get; set; } = string.Empty;
    public string ParentId { get; set; } = string.Empty; // e.g., RFQ ID
    public string DrillDownType { get; set; } = string.Empty; // "suppliers", "items", "history"
    public UiPagination Page { get; set; } = new();
}

/// <summary>
/// Dashboard configuration
/// </summary>
public class DashboardDefinition
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DashboardWidget[] Widgets { get; set; } = Array.Empty<DashboardWidget>();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DashboardWidget
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "chart", "kpi", "list"
    public string Title { get; set; } = string.Empty;
    public int Row { get; set; }
    public int Column { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public int? SavedReportId { get; set; }
    public ChartConfiguration? ChartConfig { get; set; }
}

/// <summary>
/// Export request
/// </summary>
public class ExportRequest
{
    public string Format { get; set; } = "xlsx"; // "xlsx", "csv", "pdf"
    public int? SavedReportId { get; set; }
    public UiQueryRequest? AdHocQuery { get; set; }
    public string[] Columns { get; set; } = Array.Empty<string>();
    public bool IncludeCharts { get; set; }
}
