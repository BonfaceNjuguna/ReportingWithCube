using ReportingWithCube.Analytics.Core;

namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class ItemMeasures
{
    public static MeasureDefinition OrderTotal() => new()
    {
        CubeMember = "Items.orderTotal",
        Label = "Order Total",
        Type = MeasureType.Financial.GetDefaultType(),
        Format = MeasureType.Financial.GetDefaultFormat()
    };

    public static MeasureDefinition OrderQuantity() => new()
    {
        CubeMember = "Items.orderQuantity",
        Label = "Order Quantity",
        Type = MeasureType.Count.GetDefaultType(),
        Format = MeasureType.Count.GetDefaultFormat()
    };

    public static MeasureDefinition LowestPrice() => new()
    {
        CubeMember = "Items.lowestPrice",
        Label = "Lowest Price (Unit)",
        Type = MeasureType.Financial.GetDefaultType(),
        Format = MeasureType.Financial.GetDefaultFormat()
    };

    public static MeasureDefinition UnitPriceAvg() => new()
    {
        CubeMember = "Items.unitPriceAvg",
        Label = "Average Unit Price",
        Type = MeasureType.Average.GetDefaultType(),
        Format = MeasureType.Average.GetDefaultFormat()
    };
}
