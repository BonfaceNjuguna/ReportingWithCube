namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class ItemFilters
{
    public static FilterDefinition MaterialNo() => new()
    {
        Label = "Material Number",
        Type = FilterType.String,
        CubeMember = "Items.materialNo",
        AllowedOperators = ["equals", "contains", "in"]
    };

    public static FilterDefinition MaterialGroup() => new()
    {
        Label = "Material Group",
        Type = FilterType.String,
        CubeMember = "Items.materialGroup",
        AllowedOperators = ["equals", "in"]
    };
}
