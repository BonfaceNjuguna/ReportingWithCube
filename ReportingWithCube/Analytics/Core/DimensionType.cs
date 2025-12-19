namespace ReportingWithCube.Analytics.Core;

public enum DimensionType
{
    EventIdentification,
    People,
    Organization,
    Time,
    Status,
    Attribute,
    Flag
}

public static class DimensionTypeMetadata
{
    public static string GetDefaultType(this DimensionType dimensionType) => dimensionType switch
    {
        DimensionType.EventIdentification => "string",
        DimensionType.People => "string",
        DimensionType.Organization => "string",
        DimensionType.Time => "time",
        DimensionType.Status => "string",
        DimensionType.Attribute => "string",
        DimensionType.Flag => "boolean",
        _ => "string"
    };
    
    public static bool IsFilterable(this DimensionType dimensionType) => dimensionType switch
    {
        DimensionType.EventIdentification => true,
        DimensionType.People => true,
        DimensionType.Organization => true,
        DimensionType.Time => true,
        DimensionType.Status => true,
        DimensionType.Attribute => true,
        DimensionType.Flag => false,
        _ => true
    };
}
