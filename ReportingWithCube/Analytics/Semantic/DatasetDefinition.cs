namespace ReportingWithCube.Analytics.Semantic;

/// <summary>
/// Defines a dataset's semantic model (UI business language → Cube.js mapping)
/// </summary>
public class DatasetDefinition
{
    public string Id { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public Dictionary<string, MeasureDefinition> Measures { get; init; } = new();
    public Dictionary<string, DimensionDefinition> Dimensions { get; init; } = new();
    public Dictionary<string, FilterDefinition> Filters { get; init; } = new();
    public SecurityPolicy? Security { get; init; }
}

public record MeasureDefinition
{
    public string CubeMember { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string Type { get; init; } = "number";
    public string Format { get; init; } = "number";
    public string[]? ApplicableEventTypes { get; init; } = null; // null means all types
    public bool Hidden { get; init; } = false; // If true, measure is hidden from UI selection
}

public record DimensionDefinition
{
    public string CubeMember { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string Type { get; init; } = "string";
    public string[]? ApplicableEventTypes { get; init; } = null;
}

public record FilterDefinition
{
    public string CubeMember { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public FilterType Type { get; init; }
    public string[] AllowedOperators { get; init; } = Array.Empty<string>();
    public string[]? AllowedValues { get; init; } = null;
    public string[]? ApplicableEventTypes { get; init; } = null;
}

public record SecurityPolicy
{
    public string TenantFilterMember { get; init; } = string.Empty;
    public string UserFilterMember { get; init; } = string.Empty;
    public int MaxLimit { get; init; } = 1000;
    public int MaxDateRangeDays { get; init; } = 365;
}

public enum FilterType
{
    String,
    Number,
    Time,
    Boolean
}
