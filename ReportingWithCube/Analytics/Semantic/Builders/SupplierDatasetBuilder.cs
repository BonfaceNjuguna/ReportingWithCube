using ReportingWithCube.Analytics.Semantic.Definitions.Shared;

namespace ReportingWithCube.Analytics.Semantic.Builders;

public class SupplierDatasetBuilder : IDatasetBuilder
{
    public string GetDatasetId(Core.EventType eventType) => "supplier_reports";

    public DatasetDefinition Build(Core.EventType eventType)
    {
        return new DatasetDefinition
        {
            Id = GetDatasetId(eventType),
            Label = "Supplier Reports",
            Measures = BuildMeasures(),
            Dimensions = BuildDimensions(),
            Filters = BuildFilters(),
            Security = new SecurityPolicy
            {
                TenantFilterMember = "RfqSuppliers.tenantId",
                UserFilterMember = "",
                MaxLimit = 1000,
                MaxDateRangeDays = 730
            }
        };
    }

    private Dictionary<string, MeasureDefinition> BuildMeasures()
    {
        return new Dictionary<string, MeasureDefinition>
        {
            ["total_events"] = SupplierMeasures.TotalEvents(),
            ["rfq_count"] = SupplierMeasures.RfqCount(),
            ["rfi_count"] = SupplierMeasures.RfiCount(),
            ["order_volume"] = SupplierMeasures.OrderVolume(),
            ["total_quotation_amount"] = SupplierMeasures.TotalQuotationAmount(),
            ["quotation_rate"] = SupplierMeasures.QuotationRate(),
            ["quot_to_win"] = SupplierMeasures.QuotToWin(),
            ["rating_average"] = SupplierMeasures.RatingAverage(),
            ["score_average"] = SupplierMeasures.ScoreAverage()
        };
    }

    private Dictionary<string, DimensionDefinition> BuildDimensions()
    {
        return new Dictionary<string, DimensionDefinition>
        {
            ["supplier_id"] = SupplierDimensions.SupplierId(),
            ["supplier_name"] = SupplierDimensions.SupplierName(),
            ["supplier_status"] = SupplierDimensions.SupplierStatus(),
            ["created_at"] = SupplierDimensions.CreatedAt()
        };
    }

    private Dictionary<string, FilterDefinition> BuildFilters()
    {
        return new Dictionary<string, FilterDefinition>
        {
            ["supplier_name"] = SupplierFilters.SupplierName(),
            ["supplier_status"] = SupplierFilters.SupplierStatus(),
            ["created_at"] = SupplierFilters.CreatedAt()
        };
    }
}
