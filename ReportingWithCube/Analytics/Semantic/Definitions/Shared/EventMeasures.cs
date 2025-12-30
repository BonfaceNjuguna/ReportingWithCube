using ReportingWithCube.Analytics.Core;

namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class EventMeasures
{
    // Count measures - supplier counts only
    public static MeasureDefinition InvitedSuppliersCount() => new()
    {
        CubeMember = "EventsView.invitedSuppliersCount",
        Label = "Number of Invited Suppliers",
        Type = MeasureType.Count.GetDefaultType(),
        Format = MeasureType.Count.GetDefaultFormat()
    };

    public static MeasureDefinition ViewedSuppliersCount() => new()
    {
        CubeMember = "EventsView.viewedSuppliersCount",
        Label = "Number of Suppliers (Viewed)",
        Type = MeasureType.Count.GetDefaultType(),
        Format = MeasureType.Count.GetDefaultFormat()
    };

    public static MeasureDefinition OfferedSuppliersCount() => new()
    {
        CubeMember = "EventsView.offeredSuppliersCount",
        Label = "Number of Suppliers (Offered)",
        Type = MeasureType.Count.GetDefaultType(),
        Format = MeasureType.Count.GetDefaultFormat()
    };

    public static MeasureDefinition RejectedSuppliersCount() => new()
    {
        CubeMember = "EventsView.rejectedSuppliersCount",
        Label = "Number of Suppliers (Rejected)",
        Type = MeasureType.Count.GetDefaultType(),
        Format = MeasureType.Count.GetDefaultFormat()
    };

    // Financial measures (RFQ only)
    public static MeasureDefinition BestQuotationTotal() => new()
    {
        CubeMember = "EventsView.bestQuotationTotal",
        Label = "Best Quotation Total",
        Type = MeasureType.Financial.GetDefaultType(),
        Format = MeasureType.Financial.GetDefaultFormat(),
        ApplicableEventTypes = ["RFQ"]
    };

    public static MeasureDefinition QuotationTotalAvg() => new()
    {
        CubeMember = "EventsView.quotationTotalAvg",
        Label = "Quotation Total (Average)",
        Type = MeasureType.Financial.GetDefaultType(),
        Format = MeasureType.Financial.GetDefaultFormat(),
        ApplicableEventTypes = ["RFQ"]
    };

    public static MeasureDefinition QuotationTotal() => new()
    {
        CubeMember = "EventsView.quotationTotalValid",
        Label = "Quotation Total (Valid)",
        Type = MeasureType.Financial.GetDefaultType(),
        Format = MeasureType.Financial.GetDefaultFormat(),
        ApplicableEventTypes = ["RFQ"]
    };

    // Time-based KPI measures
    public static MeasureDefinition OfferPeriodDays() => new()
    {
        CubeMember = "EventsView.offerPeriodDays",
        Label = "Offer Period (Days)",
        Type = MeasureType.TimeBased.GetDefaultType(),
        Format = MeasureType.TimeBased.GetDefaultFormat()
    };

    public static MeasureDefinition CycleTimeDays() => new()
    {
        CubeMember = "EventsView.cycleTimeDays",
        Label = "Cycle Time (Days)",
        Type = MeasureType.TimeBased.GetDefaultType(),
        Format = MeasureType.TimeBased.GetDefaultFormat()
    };

    // Rate KPI measures
    public static MeasureDefinition QuotationRate() => new()
    {
        CubeMember = "EventsView.quotationRate",
        Label = "Quotation Rate (%)",
        Type = MeasureType.Rate.GetDefaultType(),
        Format = MeasureType.Rate.GetDefaultFormat()
    };

    public static MeasureDefinition ResponseRate() => new()
    {
        CubeMember = "EventsView.responseRate",
        Label = "Response Rate (%)",
        Type = MeasureType.Rate.GetDefaultType(),
        Format = MeasureType.Rate.GetDefaultFormat()
    };

    public static MeasureDefinition RejectRate() => new()
    {
        CubeMember = "EventsView.rejectRate",
        Label = "Reject Rate (%)",
        Type = MeasureType.Rate.GetDefaultType(),
        Format = MeasureType.Rate.GetDefaultFormat()
    };
}
