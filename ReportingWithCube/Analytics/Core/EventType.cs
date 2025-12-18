namespace ReportingWithCube.Analytics.Core;

public enum EventType
{
    All,
    RFQ,
    RFI
}

public static class EventTypeMetadata
{
    public static string GetLabel(this EventType eventType) => eventType switch
    {
        EventType.All => "All Events",
        EventType.RFQ => "Request for Quotation",
        EventType.RFI => "Request for Information",
        _ => eventType.ToString()
    };
    
    public static string GetCubePrefix(this EventType eventType) => eventType switch
    {
        EventType.All => "EventsView",
        EventType.RFQ => "EventsView",
        EventType.RFI => "EventsView",
        _ => "EventsView"
    };
    
    public static bool SupportsFinancials(this EventType eventType) => eventType switch
    {
        EventType.RFQ => true,
        EventType.RFI => false,
        EventType.All => true,
        _ => false
    };
    
    public static bool SupportsOrganizationFields(this EventType eventType) => eventType switch
    {
        EventType.RFQ => true,
        EventType.RFI => false,
        EventType.All => true,
        _ => false
    };
    
    public static string[] GetSpecificDimensions(this EventType eventType) => eventType switch
    {
        EventType.RFQ => ["purchase_organisation", "company_code", "purchase_group"],
        EventType.RFI => ["technical_contact"],
        EventType.All => Array.Empty<string>(),
        _ => Array.Empty<string>()
    };
    
    public static string[] GetSpecificMeasures(this EventType eventType) => eventType switch
    {
        EventType.RFQ => ["best_quotation_total", "quotation_total_avg", "quotation_total"],
        EventType.RFI => Array.Empty<string>(),
        EventType.All => Array.Empty<string>(),
        _ => Array.Empty<string>()
    };
}
