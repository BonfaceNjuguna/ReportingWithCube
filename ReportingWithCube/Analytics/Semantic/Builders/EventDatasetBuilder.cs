using ReportingWithCube.Analytics.Core;
using ReportingWithCube.Analytics.Semantic.Definitions.Shared;

namespace ReportingWithCube.Analytics.Semantic.Builders;

public class EventDatasetBuilder : IDatasetBuilder
{
    public string GetDatasetId(EventType eventType) => eventType switch
    {
        EventType.All => "events",
        EventType.RFQ => "events-rfq",
        EventType.RFI => "events-rfi",
        _ => "events"
    };

    public DatasetDefinition Build(EventType eventType)
    {
        var eventTypeLabel = eventType.GetLabel();
        
        return new DatasetDefinition
        {
            Id = GetDatasetId(eventType),
            Label = eventType == EventType.All 
                ? "Event Reports (RFQ, RFI)" 
                : $"{eventTypeLabel} Reports",
            Measures = BuildMeasures(eventType),
            Dimensions = BuildDimensions(eventType),
            Filters = BuildFilters(eventType),
            Security = new SecurityPolicy
            {
                TenantFilterMember = GetCubeName(eventType) + ".tenant",
                UserFilterMember = GetCubeName(eventType) + ".createdBy",
                MaxLimit = 1000,
                MaxDateRangeDays = 730
            }
        };
    }

    private Dictionary<string, MeasureDefinition> BuildMeasures(EventType eventType)
    {
        var measures = new Dictionary<string, MeasureDefinition>();

        // Count measures - supplier counts only
        AddIfApplicable(measures, "invited_suppliers_count", EventMeasures.InvitedSuppliersCount(), eventType);
        AddIfApplicable(measures, "viewed_suppliers_count", EventMeasures.ViewedSuppliersCount(), eventType);
        AddIfApplicable(measures, "offered_suppliers_count", EventMeasures.OfferedSuppliersCount(), eventType);
        AddIfApplicable(measures, "rejected_suppliers_count", EventMeasures.RejectedSuppliersCount(), eventType);

        // Financial measures - RFQ only
        AddIfApplicable(measures, "best_quotation_total", EventMeasures.BestQuotationTotal(), eventType);
        AddIfApplicable(measures, "quotation_total_avg", EventMeasures.QuotationTotalAvg(), eventType);
        AddIfApplicable(measures, "quotation_total", EventMeasures.QuotationTotal(), eventType);

        // Time-based KPI measures - always applicable
        AddIfApplicable(measures, "offer_period_days", EventMeasures.OfferPeriodDays(), eventType);
        AddIfApplicable(measures, "cycle_time_days", EventMeasures.CycleTimeDays(), eventType);

        // Rate KPI measures - always applicable
        AddIfApplicable(measures, "quotation_rate", EventMeasures.QuotationRate(), eventType);
        AddIfApplicable(measures, "response_rate", EventMeasures.ResponseRate(), eventType);
        AddIfApplicable(measures, "reject_rate", EventMeasures.RejectRate(), eventType);

        return measures;
    }

    private Dictionary<string, DimensionDefinition> BuildDimensions(EventType eventType)
    {
        var dimensions = new Dictionary<string, DimensionDefinition>();

        // Event identification - always applicable
        AddIfApplicable(dimensions, "event_number", EventDimensions.EventNumber(), eventType);
        AddIfApplicable(dimensions, "event_name", EventDimensions.EventName(), eventType);
        AddIfApplicable(dimensions, "event_type", EventDimensions.EventType(), eventType);
        AddIfApplicable(dimensions, "state_name", EventDimensions.StateName(), eventType);

        // People - always applicable except technical contact (RFI only)
        AddIfApplicable(dimensions, "created_by", EventDimensions.CreatedBy(), eventType);
        AddIfApplicable(dimensions, "creator_department", EventDimensions.CreatorDepartment(), eventType);
        AddIfApplicable(dimensions, "technical_contact", EventDimensions.TechnicalContact(), eventType);
        AddIfApplicable(dimensions, "commercial_contact", EventDimensions.CommercialContact(), eventType);

        // Organization - RFQ only
        AddIfApplicable(dimensions, "purchase_organisation", EventDimensions.PurchaseOrganisation(), eventType);
        AddIfApplicable(dimensions, "company_code", EventDimensions.CompanyCode(), eventType);
        AddIfApplicable(dimensions, "purchase_group", EventDimensions.PurchaseGroup(), eventType);

        // Time - always applicable
        AddIfApplicable(dimensions, "created_at", EventDimensions.CreatedAt(), eventType);
        AddIfApplicable(dimensions, "started_at", EventDimensions.StartedAt(), eventType);
        AddIfApplicable(dimensions, "deadline", EventDimensions.Deadline(), eventType);
        AddIfApplicable(dimensions, "awarded_at", EventDimensions.AwardedAt(), eventType);

        // Attribute - always applicable
        AddIfApplicable(dimensions, "number_of_rounds", EventDimensions.NumberOfRounds(), eventType);

        return dimensions;
    }

    private Dictionary<string, FilterDefinition> BuildFilters(EventType eventType)
    {
        var filters = new Dictionary<string, FilterDefinition>();

        // Core filters - always applicable
        AddIfApplicable(filters, "event_type", EventFilters.EventType(), eventType);
        AddIfApplicable(filters, "created_by", EventFilters.CreatedBy(), eventType);
        AddIfApplicable(filters, "commercial_contact", EventFilters.CommercialContact(), eventType);
        AddIfApplicable(filters, "creator_department", EventFilters.CreatorDepartment(), eventType);
        AddIfApplicable(filters, "state_name", EventFilters.StateName(), eventType);

        // Time filters - always applicable
        AddIfApplicable(filters, "created_at", EventFilters.CreatedAt(), eventType);
        AddIfApplicable(filters, "started_at", EventFilters.StartedAt(), eventType);

        // RFI-specific filters
        AddIfApplicable(filters, "technical_contact", EventFilters.TechnicalContact(), eventType);

        // RFQ-specific filters
        AddIfApplicable(filters, "purchase_organisation", EventFilters.PurchaseOrganisation(), eventType);
        AddIfApplicable(filters, "company_code", EventFilters.CompanyCode(), eventType);
        AddIfApplicable(filters, "purchase_group", EventFilters.PurchaseGroup(), eventType);

        return filters;
    }

    private string GetCubeName(EventType eventType) => eventType switch
    {
        EventType.RFQ => "EventsRfqView",
        EventType.RFI => "EventsRfiView",
        EventType.All => "EventsRfqView", // Default to RFQ for unified view
        _ => "EventsRfqView"
    };

    private void AddIfApplicable<T>(
        Dictionary<string, T> collection,
        string key,
        T definition,
        EventType eventType) where T : class
    {
        // Extract ApplicableEventTypes using reflection
        var applicableTypes = definition.GetType()
            .GetProperty("ApplicableEventTypes")
            ?.GetValue(definition) as string[];

        // Update CubeMember to use correct cube name
        var cubeMemberProp = definition.GetType().GetProperty("CubeMember");
        if (cubeMemberProp != null)
        {
            var cubeMember = cubeMemberProp.GetValue(definition) as string;
            if (cubeMember != null && cubeMember.StartsWith("EventsView."))
            {
                var memberName = cubeMember.Substring("EventsView.".Length);
                cubeMemberProp.SetValue(definition, GetCubeName(eventType) + "." + memberName);
            }
        }

        // If no restrictions, or if current event type is in the list, add it
        if (applicableTypes == null || applicableTypes.Length == 0)
        {
            collection[key] = definition;
        }
        else if (eventType == EventType.All)
        {
            // For "All" event type, include all members
            collection[key] = definition;
        }
        else if (applicableTypes.Contains(eventType.ToString()))
        {
            collection[key] = definition;
        }
    }
}
