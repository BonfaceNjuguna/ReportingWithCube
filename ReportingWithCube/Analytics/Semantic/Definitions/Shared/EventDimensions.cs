using ReportingWithCube.Analytics.Core;

namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class EventDimensions
{
    // Event identification dimensions
    public static DimensionDefinition EventNumber() => new()
    {
        CubeMember = "EventsView.number",
        Label = "Event No",
        Type = DimensionType.EventIdentification.GetDefaultType()
    };

    public static DimensionDefinition EventName() => new()
    {
        CubeMember = "EventsView.name",
        Label = "Event Name",
        Type = DimensionType.EventIdentification.GetDefaultType()
    };

    public static DimensionDefinition EventType() => new()
    {
        CubeMember = "EventsView.eventType",
        Label = "Event Type",
        Type = DimensionType.EventIdentification.GetDefaultType()
    };

    // Status dimensions
    public static DimensionDefinition StateName() => new()
    {
        CubeMember = "EventsView.stateName",
        Label = "Status Name",
        Type = DimensionType.Status.GetDefaultType()
    };

    // People dimensions
    public static DimensionDefinition CreatedBy() => new()
    {
        CubeMember = "EventsView.createdBy",
        Label = "Created By",
        Type = DimensionType.People.GetDefaultType()
    };

    public static DimensionDefinition CreatorDepartment() => new()
    {
        CubeMember = "EventsView.creatorDepartment",
        Label = "Department (Creator)",
        Type = DimensionType.People.GetDefaultType()
    };

    public static DimensionDefinition TechnicalContact() => new()
    {
        CubeMember = "EventsView.technicalContact",
        Label = "Technical Contact",
        Type = DimensionType.People.GetDefaultType(),
        ApplicableEventTypes = ["RFI"]
    };

    public static DimensionDefinition CommercialContact() => new()
    {
        CubeMember = "EventsView.commercialContact",
        Label = "Commercial Contact",
        Type = DimensionType.People.GetDefaultType()
    };

    // Organization dimensions (RFQ only)
    public static DimensionDefinition PurchaseOrganisation() => new()
    {
        CubeMember = "EventsView.purchaseOrganisation",
        Label = "Purchase Organisation",
        Type = DimensionType.Organization.GetDefaultType(),
        ApplicableEventTypes = ["RFQ"]
    };

    public static DimensionDefinition CompanyCode() => new()
    {
        CubeMember = "EventsView.companyCode",
        Label = "Company Code",
        Type = DimensionType.Organization.GetDefaultType(),
        ApplicableEventTypes = ["RFQ"]
    };

    public static DimensionDefinition PurchaseGroup() => new()
    {
        CubeMember = "EventsView.purchaseGroup",
        Label = "Purchase Group",
        Type = DimensionType.Organization.GetDefaultType(),
        ApplicableEventTypes = ["RFQ"]
    };

    // Time dimensions
    public static DimensionDefinition CreatedAt() => new()
    {
        CubeMember = "EventsView.createdAt",
        Label = "Created At",
        Type = DimensionType.Time.GetDefaultType()
    };

    public static DimensionDefinition StartedAt() => new()
    {
        CubeMember = "EventsView.startedDate",
        Label = "Started/Published At",
        Type = DimensionType.Time.GetDefaultType()
    };

    public static DimensionDefinition Deadline() => new()
    {
        CubeMember = "EventsView.deadline",
        Label = "Deadline",
        Type = DimensionType.Time.GetDefaultType()
    };

    public static DimensionDefinition AwardedAt() => new()
    {
        CubeMember = "EventsView.awardedAt",
        Label = "Award Decision Date",
        Type = DimensionType.Time.GetDefaultType()
    };

    // Attribute dimensions
    public static DimensionDefinition NumberOfRounds() => new()
    {
        CubeMember = "EventsView.roundNumber",
        Label = "Number of Rounds",
        Type = "number" // Numeric dimension
    };
}
