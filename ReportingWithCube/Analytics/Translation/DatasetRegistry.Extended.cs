using ReportingWithCube.Analytics.Semantic;

namespace ReportingWithCube.Analytics.Translation;

/// <summary>
/// Extended dataset registry with comprehensive event, supplier, and item datasets
/// Covers all KPIs and dimensions from the reporting requirements
/// </summary>
public partial class DatasetRegistry
{
    /// <summary>
    /// Comprehensive RFQ/RFI Events dataset
    /// Object type: Events
    /// </summary>
    private static DatasetDefinition CreateComprehensiveEventsDataset()
    {
        return new DatasetDefinition
        {
            Id = "events",
            Label = "Event Reports (RFQ, RFI)",
            Measures = new()
            {
                // Count measures
                ["event_count"] = new()
                {
                    CubeMember = "EventsView.count",
                    Label = "Event Count",
                    Type = "number",
                    Format = "number"
                },
                ["invited_suppliers_count"] = new()
                {
                    CubeMember = "EventsView.invitedSuppliersCount",
                    Label = "Number of Invited Suppliers",
                    Type = "number",
                    Format = "number"
                },
                ["viewed_suppliers_count"] = new()
                {
                    CubeMember = "EventsView.viewedSuppliersCount",
                    Label = "Number of Suppliers (Viewed)",
                    Type = "number",
                    Format = "number"
                },
                ["offered_suppliers_count"] = new()
                {
                    CubeMember = "EventsView.offeredSuppliersCount",
                    Label = "Number of Suppliers (Offered)",
                    Type = "number",
                    Format = "number"
                },
                ["rejected_suppliers_count"] = new()
                {
                    CubeMember = "EventsView.rejectedSuppliersCount",
                    Label = "Number of Suppliers (Rejected)",
                    Type = "number",
                    Format = "number"
                },
                
                // Financial measures (RFQ only)
                ["best_quotation_total"] = new()
                {
                    CubeMember = "EventsView.bestQuotationTotal",
                    Label = "Best Quotation Total",
                    Type = "number",
                    Format = "currency",
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                ["quotation_total_avg"] = new()
                {
                    CubeMember = "EventsView.quotationTotalAvg",
                    Label = "Quotation Total (Average)",
                    Type = "number",
                    Format = "currency",
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                ["quotation_total"] = new()
                {
                    CubeMember = "EventsView.quotationTotal",
                    Label = "Quotation Total",
                    Type = "number",
                    Format = "currency",
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                
                // KPI measures - Time-based
                ["offer_period_days"] = new()
                {
                    CubeMember = "EventsView.offerPeriodDays",
                    Label = "Offer Period (Days)",
                    Type = "number",
                    Format = "number"
                },
                ["avg_offer_period_days"] = new()
                {
                    CubeMember = "EventsView.avgOfferPeriodDays",
                    Label = "Average Offer Period (Days)",
                    Type = "number",
                    Format = "number"
                },
                ["cycle_time_days"] = new()
                {
                    CubeMember = "EventsView.cycleTimeDays",
                    Label = "Cycle Time (Days)",
                    Type = "number",
                    Format = "number"
                },
                ["avg_cycle_time_days"] = new()
                {
                    CubeMember = "EventsView.avgCycleTimeDays",
                    Label = "Average Cycle Time (Days)",
                    Type = "number",
                    Format = "number"
                },
                
                // KPI measures - Rates
                ["quotation_rate"] = new()
                {
                    CubeMember = "EventsView.quotationRate",
                    Label = "Quotation Rate (%)",
                    Type = "number",
                    Format = "percent"
                },
                ["response_rate"] = new()
                {
                    CubeMember = "EventsView.responseRate",
                    Label = "Response Rate (%)",
                    Type = "number",
                    Format = "percent"
                },
                ["reject_rate"] = new()
                {
                    CubeMember = "EventsView.rejectRate",
                    Label = "Reject Rate (%)",
                    Type = "number",
                    Format = "percent"
                },
                
                // Quotation measures
                ["best_quotation_total"] = new()
                {
                    CubeMember = "EventsView.bestQuotationTotal",
                    Label = "Best Quotation Total",
                    Type = "number",
                    Format = "currency"
                },
                ["opened_quotations_count"] = new()
                {
                    CubeMember = "EventsView.openedQuotationsCount",
                    Label = "Opened Quotations Count",
                    Type = "number",
                    Format = "number"
                },
                ["last_round_number"] = new()
                {
                    CubeMember = "EventsView.lastRoundNumber",
                    Label = "Last Round Number",
                    Type = "number",
                    Format = "number"
                },
                
                // Supplier state counts
                ["suppliers_in_process_count"] = new()
                {
                    CubeMember = "EventsView.suppliersInProcessCount",
                    Label = "Suppliers In Process",
                    Type = "number",
                    Format = "number"
                },
                ["suppliers_rejected_count"] = new()
                {
                    CubeMember = "EventsView.suppliersRejectedCount",
                    Label = "Suppliers Rejected",
                    Type = "number",
                    Format = "number"
                },
                ["suppliers_submitted_count"] = new()
                {
                    CubeMember = "EventsView.suppliersSubmittedCount",
                    Label = "Suppliers Submitted (Reply)",
                    Type = "number",
                    Format = "number"
                }
            },
            
            Dimensions = new()
            {
                // Event identification
                ["event_number"] = new()
                {
                    CubeMember = "EventsView.rfqNo",
                    Label = "Event No",
                    Type = "string"
                },
                ["event_name"] = new()
                {
                    CubeMember = "EventsView.rfqName",
                    Label = "Event Name",
                    Type = "string"
                },
                ["event_type"] = new()
                {
                    CubeMember = "EventsView.eventType",
                    Label = "Event Type",
                    Type = "string"
                },
                ["state_name"] = new()
                {
                    CubeMember = "EventsView.stateName",
                    Label = "Status Name",
                    Type = "string"
                },
                
                // People
                ["created_by"] = new()
                {
                    CubeMember = "EventsView.creatorName",
                    Label = "Created By",
                    Type = "string"
                },
                ["creator_department"] = new()
                {
                    CubeMember = "EventsView.creatorDepartment",
                    Label = "Department (Creator)",
                    Type = "string"
                },
                ["technical_contact"] = new()
                {
                    CubeMember = "EventsView.technicalContact",
                    Label = "Technical Contact",
                    Type = "string",
                    ApplicableEventTypes = new[] { "RFI" }
                },
                ["commercial_contact"] = new()
                {
                    CubeMember = "EventsView.commercialContact",
                    Label = "Commercial Contact",
                    Type = "string"
                },
                
                // Organization fields (RFQ only)
                ["purchase_organisation"] = new()
                {
                    CubeMember = "EventsView.purchaseOrganisation",
                    Label = "Purchase Organisation",
                    Type = "string",
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                ["company_code"] = new()
                {
                    CubeMember = "EventsView.companyCode",
                    Label = "Company Code",
                    Type = "string",
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                ["purchase_group"] = new()
                {
                    CubeMember = "EventsView.purchaseGroup",
                    Label = "Purchase Group",
                    Type = "string",
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                
                // Dates
                ["created_at"] = new()
                {
                    CubeMember = "EventsView.createdAt",
                    Label = "Created At",
                    Type = "time"
                },
                ["started_at"] = new()
                {
                    CubeMember = "EventsView.startedDate",
                    Label = "Started/Published At",
                    Type = "time"
                },
                ["deadline"] = new()
                {
                    CubeMember = "EventsView.submissionDeadline",
                    Label = "Deadline",
                    Type = "time"
                },
                ["awarded_at"] = new()
                {
                    CubeMember = "EventsView.awardedAt",
                    Label = "Award Decision Date",
                    Type = "time"
                },
                
                // Other attributes
                ["number_of_rounds"] = new()
                {
                    CubeMember = "EventsView.numberOfRounds",
                    Label = "Number of Rounds",
                    Type = "number"
                }
            },
            
            Filters = new()
            {
                ["event_type"] = new()
                {
                    Label = "Event Type",
                    Type = FilterType.String,
                    CubeMember = "EventsView.eventType",
                    AllowedOperators = ["equals", "notEquals", "in"]
                },
                ["created_by"] = new()
                {
                    Label = "Created By",
                    Type = FilterType.String,
                    CubeMember = "EventsView.creatorName",
                    AllowedOperators = ["equals", "contains", "in"]
                },
                ["creator_id"] = new()
                {
                    Label = "Creator ID",
                    Type = FilterType.String,
                    CubeMember = "EventsView.creatorId",
                    AllowedOperators = ["equals", "in"]
                },
                ["technical_contact"] = new()
                {
                    Label = "Technical Contact",
                    Type = FilterType.String,
                    CubeMember = "EventsView.technicalContact",
                    AllowedOperators = ["equals", "contains", "in"],
                    ApplicableEventTypes = new[] { "RFI" }
                },
                ["commercial_contact"] = new()
                {
                    Label = "Commercial Contact",
                    Type = FilterType.String,
                    CubeMember = "EventsView.commercialContact",
                    AllowedOperators = ["equals", "contains", "in"]
                },
                ["purchase_organisation"] = new()
                {
                    Label = "Purchase Organisation",
                    Type = FilterType.String,
                    CubeMember = "EventsView.purchaseOrganisation",
                    AllowedOperators = ["equals", "in"],
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                ["company_code"] = new()
                {
                    Label = "Company Code",
                    Type = FilterType.String,
                    CubeMember = "EventsView.companyCode",
                    AllowedOperators = ["equals", "in"],
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                ["purchase_group"] = new()
                {
                    Label = "Purchase Group",
                    Type = FilterType.String,
                    CubeMember = "EventsView.purchaseGroup",
                    AllowedOperators = ["equals", "in"],
                    ApplicableEventTypes = new[] { "RFQ" }
                },
                ["creator_department"] = new()
                {
                    Label = "Creator Department",
                    Type = FilterType.String,
                    CubeMember = "EventsView.creatorDepartment",
                    AllowedOperators = ["equals", "in", "contains"]
                },
                ["state_name"] = new()
                {
                    Label = "Status Name",
                    Type = FilterType.String,
                    CubeMember = "EventsView.stateName",
                    AllowedOperators = ["equals", "notEquals", "in", "contains"]
                },
                ["created_at"] = new()
                {
                    Label = "Created At",
                    Type = FilterType.Time,
                    CubeMember = "EventsView.createdAt",
                    AllowedOperators = ["inDateRange", "afterDate", "beforeDate"]
                },
                ["started_at"] = new()
                {
                    Label = "Started At",
                    Type = FilterType.Time,
                    CubeMember = "EventsView.startedDate",
                    AllowedOperators = ["inDateRange", "afterDate", "beforeDate"]
                },
                ["deadline"] = new()
                {
                    Label = "Deadline",
                    Type = FilterType.Time,
                    CubeMember = "EventsView.submissionDeadline",
                    AllowedOperators = ["inDateRange", "afterDate", "beforeDate"]
                }
            },
            
            Security = new()
            {
                TenantFilterMember = "EventsView.tenantId",
                UserFilterMember = "",
                MaxLimit = 1000,
                MaxDateRangeDays = 365
            }
        };
    }

    /// <summary>
    /// Comprehensive Supplier Reports dataset
    /// Object type: Suppliers
    /// </summary>
    private static DatasetDefinition CreateSupplierReportsDataset()
    {
        return new DatasetDefinition
        {
            Id = "supplier_reports",
            Label = "Supplier Reports",
            Measures = new()
            {
                // Event participation counts
                ["total_events"] = new()
                {
                    CubeMember = "RfqSuppliers.totalEvents",
                    Label = "Number of All Events",
                    Type = "number",
                    Format = "number"
                },
                ["rfq_count"] = new()
                {
                    CubeMember = "RfqSuppliers.rfqCount",
                    Label = "Number of RFQs",
                    Type = "number",
                    Format = "number"
                },
                ["rfi_count"] = new()
                {
                    CubeMember = "RfqSuppliers.rfiCount",
                    Label = "Number of RFIs",
                    Type = "number",
                    Format = "number"
                },
                ["rfp_count"] = new()
                {
                    CubeMember = "RfqSuppliers.rfpCount",
                    Label = "Number of RFPs",
                    Type = "number",
                    Format = "number"
                },
                ["auction_count"] = new()
                {
                    CubeMember = "RfqSuppliers.auctionCount",
                    Label = "Number of eAuctions",
                    Type = "number",
                    Format = "number"
                },
                
                // Financial measures
                ["order_volume"] = new()
                {
                    CubeMember = "RfqSuppliers.orderVolume",
                    Label = "Order Volume",
                    Type = "number",
                    Format = "currency"
                },
                ["total_quotation_amount"] = new()
                {
                    CubeMember = "RfqSuppliers.totalQuotationAmount",
                    Label = "Total Quotation Amount",
                    Type = "number",
                    Format = "currency"
                },
                
                // KPI measures
                ["quotation_rate"] = new()
                {
                    CubeMember = "RfqSuppliers.quotationRate",
                    Label = "Quotation Rate (%)",
                    Type = "number",
                    Format = "percent"
                },
                ["quot_to_win"] = new()
                {
                    CubeMember = "RfqSuppliers.quotToWin",
                    Label = "Quote-to-Win Rate (%)",
                    Type = "number",
                    Format = "percent"
                },
                ["rating_average"] = new()
                {
                    CubeMember = "RfqSuppliers.ratingAverage",
                    Label = "Rating Average",
                    Type = "number",
                    Format = "number"
                },
                ["score_average"] = new()
                {
                    CubeMember = "RfqSuppliers.scoreAverage",
                    Label = "Score Average",
                    Type = "number",
                    Format = "number"
                }
            },
            
            Dimensions = new()
            {
                ["supplier_id"] = new()
                {
                    CubeMember = "RfqSuppliers.supplierId",
                    Label = "Supplier ID",
                    Type = "string"
                },
                ["supplier_name"] = new()
                {
                    CubeMember = "RfqSuppliers.supplierName",
                    Label = "Supplier Name",
                    Type = "string"
                },
                ["supplier_status"] = new()
                {
                    CubeMember = "RfqSuppliers.status",
                    Label = "Processing Status",
                    Type = "string"
                },
                ["created_at"] = new()
                {
                    CubeMember = "RfqSuppliers.createdAt",
                    Label = "Created At (in Supplier Portal)",
                    Type = "time"
                }
            },
            
            Filters = new()
            {
                ["supplier_name"] = new()
                {
                    Label = "Supplier Name",
                    Type = FilterType.String,
                    CubeMember = "RfqSuppliers.supplierName",
                    AllowedOperators = ["equals", "contains", "in"]
                },
                ["supplier_status"] = new()
                {
                    Label = "Supplier Status",
                    Type = FilterType.String,
                    CubeMember = "RfqSuppliers.status",
                    AllowedOperators = ["equals", "in"]
                },
                ["created_at"] = new()
                {
                    Label = "Created At",
                    Type = FilterType.Time,
                    CubeMember = "RfqSuppliers.createdAt",
                    AllowedOperators = ["inDateRange", "afterDate", "beforeDate"]
                }
            },
            
            Security = new()
            {
                TenantFilterMember = "RfqSuppliers.tenantId",
                UserFilterMember = "",
                MaxLimit = 1000,
                MaxDateRangeDays = 730
            }
        };
    }

    /// <summary>
    /// Item/Material Reports dataset
    /// Object type: Items
    /// </summary>
    private static DatasetDefinition CreateItemReportsDataset()
    {
        return new DatasetDefinition
        {
            Id = "item_reports",
            Label = "Item/Material Reports",
            Measures = new()
            {
                ["order_total"] = new()
                {
                    CubeMember = "Items.orderTotal",
                    Label = "Order Total",
                    Type = "number",
                    Format = "currency"
                },
                ["order_quantity"] = new()
                {
                    CubeMember = "Items.orderQuantity",
                    Label = "Order Quantity",
                    Type = "number",
                    Format = "number"
                },
                ["lowest_price"] = new()
                {
                    CubeMember = "Items.lowestPrice",
                    Label = "Lowest Price (Unit)",
                    Type = "number",
                    Format = "currency"
                },
                ["unit_price_avg"] = new()
                {
                    CubeMember = "Items.unitPriceAvg",
                    Label = "Average Unit Price",
                    Type = "number",
                    Format = "currency"
                }
            },
            
            Dimensions = new()
            {
                ["material_no"] = new()
                {
                    CubeMember = "Items.materialNo",
                    Label = "Material No.",
                    Type = "string"
                },
                ["material_group"] = new()
                {
                    CubeMember = "Items.materialGroup",
                    Label = "Material Group",
                    Type = "string"
                },
                ["supplier_name"] = new()
                {
                    CubeMember = "Items.supplierName",
                    Label = "Supplier (Lowest Price)",
                    Type = "string"
                },
                ["unit"] = new()
                {
                    CubeMember = "Items.unit",
                    Label = "Unit",
                    Type = "string"
                }
            },
            
            Filters = new()
            {
                ["material_no"] = new()
                {
                    Label = "Material Number",
                    Type = FilterType.String,
                    CubeMember = "Items.materialNo",
                    AllowedOperators = ["equals", "contains", "in"]
                },
                ["material_group"] = new()
                {
                    Label = "Material Group",
                    Type = FilterType.String,
                    CubeMember = "Items.materialGroup",
                    AllowedOperators = ["equals", "in"]
                }
            },
            
            Security = new()
            {
                TenantFilterMember = "Items.tenantId",
                UserFilterMember = "",
                MaxLimit = 1000,
                MaxDateRangeDays = 365
            }
        };
    }
}
