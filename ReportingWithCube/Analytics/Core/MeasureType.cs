namespace ReportingWithCube.Analytics.Core;

public enum MeasureType
{
    Count,
    Financial,
    TimeBased,
    Rate,
    Average,
    Aggregate
}

public static class MeasureTypeMetadata
{
    public static string GetDefaultFormat(this MeasureType measureType) => measureType switch
    {
        MeasureType.Count => "number",
        MeasureType.Financial => "currency",
        MeasureType.TimeBased => "number",
        MeasureType.Rate => "percent",
        MeasureType.Average => "number",
        MeasureType.Aggregate => "number",
        _ => "number"
    };
    
    public static string GetDefaultType(this MeasureType measureType) => measureType switch
    {
        MeasureType.Count => "number",
        MeasureType.Financial => "number",
        MeasureType.TimeBased => "number",
        MeasureType.Rate => "number",
        MeasureType.Average => "number",
        MeasureType.Aggregate => "number",
        _ => "number"
    };
}
