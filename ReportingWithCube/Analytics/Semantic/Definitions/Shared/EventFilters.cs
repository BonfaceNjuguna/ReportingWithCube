namespace ReportingWithCube.Analytics.Semantic.Definitions.Shared;

public static class EventFilters
{
    public static FilterDefinition EventType() => new()
    {
        Label = "Event Type",
        Type = FilterType.String,
        CubeMember = "EventsView.eventType",
        AllowedOperators = ["equals", "notEquals", "in"]
    };

    public static FilterDefinition CreatedBy() => new()
    {
        Label = "Created By",
        Type = FilterType.String,
        CubeMember = "EventsView.createdBy",
        AllowedOperators = ["equals", "contains", "in"]
    };

    public static FilterDefinition TechnicalContact() => new()
    {
        Label = "Technical Contact",
        Type = FilterType.String,
        CubeMember = "EventsView.technicalContact",
        AllowedOperators = ["equals", "contains", "in"],
        ApplicableEventTypes = ["RFI"]
    };

    public static FilterDefinition CommercialContact() => new()
    {
        Label = "Commercial Contact",
        Type = FilterType.String,
        CubeMember = "EventsView.commercialContact",
        AllowedOperators = ["equals", "contains", "in"]
    };

    public static FilterDefinition PurchaseOrganisation() => new()
    {
        Label = "Purchase Organisation",
        Type = FilterType.String,
        CubeMember = "EventsView.purchaseOrganisation",
        AllowedOperators = ["equals", "in"],
        ApplicableEventTypes = ["RFQ"]
    };

    public static FilterDefinition CompanyCode() => new()
    {
        Label = "Company Code",
        Type = FilterType.String,
        CubeMember = "EventsView.companyCode",
        AllowedOperators = ["equals", "in"],
        ApplicableEventTypes = ["RFQ"]
    };

    public static FilterDefinition PurchaseGroup() => new()
    {
        Label = "Purchase Group",
        Type = FilterType.String,
        CubeMember = "EventsView.purchaseGroup",
        AllowedOperators = ["equals", "in"],
        ApplicableEventTypes = ["RFQ"]
    };

    public static FilterDefinition CreatorDepartment() => new()
    {
        Label = "Creator Department",
        Type = FilterType.String,
        CubeMember = "EventsView.creatorDepartment",
        AllowedOperators = ["equals", "in", "contains"]
    };

    public static FilterDefinition StateName() => new()
    {
        Label = "Status Name",
        Type = FilterType.String,
        CubeMember = "EventsView.stateName",
        AllowedOperators = ["equals", "notEquals", "in", "contains"],
        AllowedValues = ["InPreparation", "Running", "Closed", "Completed", "Canceled"]
    };

    public static FilterDefinition CreatedAt() => new()
    {
        Label = "Created At",
        Type = FilterType.Time,
        CubeMember = "EventsView.createdAt",
        AllowedOperators = ["inDateRange", "afterDate", "beforeDate"]
    };

    public static FilterDefinition StartedAt() => new()
    {
        Label = "Started At",
        Type = FilterType.Time,
        CubeMember = "EventsView.startedDate",
        AllowedOperators = ["inDateRange", "afterDate", "beforeDate"]
    };
}
