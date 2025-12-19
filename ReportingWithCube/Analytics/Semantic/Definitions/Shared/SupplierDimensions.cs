using ReportingWithCube.Analytics.Core;

namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class SupplierDimensions
{
    public static DimensionDefinition SupplierId() => new()
    {
        CubeMember = "RfqSuppliers.supplierId",
        Label = "Supplier ID",
        Type = DimensionType.EventIdentification.GetDefaultType()
    };

    public static DimensionDefinition SupplierName() => new()
    {
        CubeMember = "RfqSuppliers.supplierName",
        Label = "Supplier Name",
        Type = DimensionType.EventIdentification.GetDefaultType()
    };

    public static DimensionDefinition SupplierStatus() => new()
    {
        CubeMember = "RfqSuppliers.status",
        Label = "Processing Status",
        Type = DimensionType.Status.GetDefaultType()
    };

    public static DimensionDefinition CreatedAt() => new()
    {
        CubeMember = "RfqSuppliers.createdAt",
        Label = "Created At (in Supplier Portal)",
        Type = DimensionType.Time.GetDefaultType()
    };
}
