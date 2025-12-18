using ReportingWithCube.Analytics.Core;

namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class SupplierMeasures
{
    // Event participation counts
    public static MeasureDefinition TotalEvents() => new()
    {
        CubeMember = "RfqSuppliers.totalEvents",
        Label = "Number of All Events",
        Type = MeasureType.Count.GetDefaultType(),
        Format = MeasureType.Count.GetDefaultFormat()
    };

    public static MeasureDefinition RfqCount() => new()
    {
        CubeMember = "RfqSuppliers.rfqCount",
        Label = "Number of RFQs",
        Type = MeasureType.Count.GetDefaultType(),
        Format = MeasureType.Count.GetDefaultFormat()
    };

    public static MeasureDefinition RfiCount() => new()
    {
        CubeMember = "RfqSuppliers.rfiCount",
        Label = "Number of RFIs",
        Type = MeasureType.Count.GetDefaultType(),
        Format = MeasureType.Count.GetDefaultFormat()
    };

    // Financial measures
    public static MeasureDefinition OrderVolume() => new()
    {
        CubeMember = "RfqSuppliers.orderVolume",
        Label = "Order Volume",
        Type = MeasureType.Financial.GetDefaultType(),
        Format = MeasureType.Financial.GetDefaultFormat()
    };

    public static MeasureDefinition TotalQuotationAmount() => new()
    {
        CubeMember = "RfqSuppliers.totalQuotationAmount",
        Label = "Total Quotation Amount",
        Type = MeasureType.Financial.GetDefaultType(),
        Format = MeasureType.Financial.GetDefaultFormat()
    };

    // KPI measures
    public static MeasureDefinition QuotationRate() => new()
    {
        CubeMember = "RfqSuppliers.quotationRate",
        Label = "Quotation Rate (%)",
        Type = MeasureType.Rate.GetDefaultType(),
        Format = MeasureType.Rate.GetDefaultFormat()
    };

    public static MeasureDefinition QuotToWin() => new()
    {
        CubeMember = "RfqSuppliers.quotToWin",
        Label = "Quote-to-Win Rate (%)",
        Type = MeasureType.Rate.GetDefaultType(),
        Format = MeasureType.Rate.GetDefaultFormat()
    };

    public static MeasureDefinition RatingAverage() => new()
    {
        CubeMember = "RfqSuppliers.ratingAverage",
        Label = "Rating Average",
        Type = MeasureType.Average.GetDefaultType(),
        Format = MeasureType.Average.GetDefaultFormat()
    };

    public static MeasureDefinition ScoreAverage() => new()
    {
        CubeMember = "RfqSuppliers.scoreAverage",
        Label = "Score Average",
        Type = MeasureType.Average.GetDefaultType(),
        Format = MeasureType.Average.GetDefaultFormat()
    };
}
