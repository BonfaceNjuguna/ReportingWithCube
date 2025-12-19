namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class SupplierFilters
{
    public static FilterDefinition SupplierName() => new()
    {
        Label = "Supplier Name",
        Type = FilterType.String,
        CubeMember = "RfqSuppliers.supplierName",
        AllowedOperators = ["equals", "contains", "in"]
    };

    public static FilterDefinition SupplierStatus() => new()
    {
        Label = "Supplier Status",
        Type = FilterType.String,
        CubeMember = "RfqSuppliers.status",
        AllowedOperators = ["equals", "in"]
    };

    public static FilterDefinition CreatedAt() => new()
    {
        Label = "Created At",
        Type = FilterType.Time,
        CubeMember = "RfqSuppliers.createdAt",
        AllowedOperators = ["inDateRange", "afterDate", "beforeDate"]
    };
}
