using ReportingWithCube.Analytics.Semantic.Definitions.Shared;

namespace ReportingWithCube.Analytics.Semantic.Builders;

public class ItemDatasetBuilder : IDatasetBuilder
{
    public string GetDatasetId(Core.EventType eventType) => "item_reports";

    public DatasetDefinition Build(Core.EventType eventType)
    {
        return new DatasetDefinition
        {
            Id = GetDatasetId(eventType),
            Label = "Item/Material Reports",
            Measures = BuildMeasures(),
            Dimensions = BuildDimensions(),
            Filters = BuildFilters(),
            Security = new SecurityPolicy
            {
                TenantFilterMember = "Items.tenantId",
                UserFilterMember = "",
                MaxLimit = 1000,
                MaxDateRangeDays = 365
            }
        };
    }

    private Dictionary<string, MeasureDefinition> BuildMeasures()
    {
        return new Dictionary<string, MeasureDefinition>
        {
            ["order_total"] = ItemMeasures.OrderTotal(),
            ["order_quantity"] = ItemMeasures.OrderQuantity(),
            ["lowest_price"] = ItemMeasures.LowestPrice(),
            ["unit_price_avg"] = ItemMeasures.UnitPriceAvg()
        };
    }

    private Dictionary<string, DimensionDefinition> BuildDimensions()
    {
        return new Dictionary<string, DimensionDefinition>
        {
            ["material_no"] = ItemDimensions.MaterialNo(),
            ["material_group"] = ItemDimensions.MaterialGroup(),
            ["supplier_name"] = ItemDimensions.SupplierName(),
            ["unit"] = ItemDimensions.Unit()
        };
    }

    private Dictionary<string, FilterDefinition> BuildFilters()
    {
        return new Dictionary<string, FilterDefinition>
        {
            ["material_no"] = ItemFilters.MaterialNo(),
            ["material_group"] = ItemFilters.MaterialGroup()
        };
    }
}
