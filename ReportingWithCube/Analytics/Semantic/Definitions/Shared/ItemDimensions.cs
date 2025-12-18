using ReportingWithCube.Analytics.Core;

namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class ItemDimensions
{
    public static DimensionDefinition MaterialNo() => new()
    {
        CubeMember = "Items.materialNo",
        Label = "Material No.",
        Type = DimensionType.EventIdentification.GetDefaultType()
    };

    public static DimensionDefinition MaterialGroup() => new()
    {
        CubeMember = "Items.materialGroup",
        Label = "Material Group",
        Type = DimensionType.Attribute.GetDefaultType()
    };

    public static DimensionDefinition SupplierName() => new()
    {
        CubeMember = "Items.supplierName",
        Label = "Supplier (Lowest Price)",
        Type = DimensionType.People.GetDefaultType()
    };

    public static DimensionDefinition Unit() => new()
    {
        CubeMember = "Items.unit",
        Label = "Unit",
        Type = DimensionType.Attribute.GetDefaultType()
    };
}
