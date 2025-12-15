namespace ReportingWithCube.Analytics.Models;

using System.Text.Json.Serialization;

/// <summary>
/// UI-facing query request (business language, no Cube.js specifics)
/// </summary>
public record UiQueryRequest
{
    public string DatasetId { get; init; } = string.Empty;
    public string[] Kpis { get; init; } = Array.Empty<string>();
    public string[] GroupBy { get; init; } = Array.Empty<string>();
    public UiFilter[] Filters { get; init; } = Array.Empty<UiFilter>();
    public UiSort? Sort { get; init; }
    public UiPagination Page { get; init; } = new();
}

public record UiFilter
{
    public string Field { get; init; } = string.Empty;
    public string Operator { get; init; } = string.Empty;
    public object Value { get; init; } = string.Empty;
}

public record UiSort
{
    public string By { get; init; } = string.Empty;
    public string Direction { get; init; } = "asc";
}

public record UiPagination
{
    public int Limit { get; init; } = 100;
    public int Offset { get; init; } = 0;
}

/// <summary>
/// Cube.js query request (technical, maps to Cube.js API)
/// </summary>
public record AnalyticsQueryRequest
{
    [JsonIgnore]
    public string Dataset { get; init; } = string.Empty;
    public string[] Measures { get; init; } = Array.Empty<string>();
    public string[] Dimensions { get; init; } = Array.Empty<string>();
    public TimeDimension[] TimeDimensions { get; init; } = Array.Empty<TimeDimension>();
    public CubeFilter[] Filters { get; init; } = Array.Empty<CubeFilter>();
    public Dictionary<string, string>? Order { get; init; }
    public int? Limit { get; init; }
    public int? Offset { get; init; }
}

public record TimeDimension
{
    public string Dimension { get; init; } = string.Empty;
    public object DateRange { get; init; } = string.Empty;
    public string? Granularity { get; init; }
}

public record CubeFilter
{
    public string Member { get; init; } = string.Empty;
    public string Operator { get; init; } = string.Empty;
    public string[] Values { get; init; } = Array.Empty<string>();
}

/// <summary>
/// Response for analytics queries
/// </summary>
public record AnalyticsQueryResponse
{
    public object[] Data { get; init; } = Array.Empty<object>();
    public ColumnMetadata[] Columns { get; init; } = Array.Empty<ColumnMetadata>();
    public QueryMetadata Query { get; init; } = new();
}

public record ColumnMetadata
{
    public string Name { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
}

public record QueryMetadata
{
    public string Dataset { get; init; } = string.Empty;
    public int RowCount { get; init; }
    public long ExecutionTimeMs { get; init; }
    public bool FromCache { get; init; }
}
