// Comprehensive Events View - UNION of all event types (RFQ, RFI, RFP, etc.)
// This combines material_rfq, request_for_information, and future event types

cube(`EventsView`, {
  sql: `
    SELECT 
      id,
      'RFQ' as event_type,
      "number",
      name,
      short_description,
      current_state_id,
      purchase_organisation,
      company_code,
      purchase_group,
      commercial_contact,
      technical_contact,
      created_by,
      created_at,
      updated_at,
      started_date,
      deadline,
      replies_opened_at,
      replies_opened_by,
      domain,
      currency,
      total_price,
      round_number,
      document_language,
      is_in_edit_mode,
      has_document_changed,
      has_deadline_changed
    FROM public.material_rfq
    
    UNION ALL
    
    SELECT 
      id,
      'RFI' as event_type,
      "number",
      name,
      short_description,
      current_state_id,
      NULL as purchase_organisation,
      NULL as company_code,
      NULL as purchase_group,
      commercial_contact,
      technical_contact,
      created_by,
      created_at,
      updated_at,
      started_date,
      deadline,
      replies_opened_at,
      replies_opened_by,
      domain,
      NULL as currency,
      NULL as total_price,
      round_number,
      document_language,
      is_in_edit_mode,
      has_document_changed,
      has_deadline_changed
    FROM public.request_for_information
  `,
  
  preAggregations: {
    comprehensive: {
      measures: [
        EventsView.count,
        EventsView.quotationRate,
        EventsView.rejectRate,
        EventsView.avgCycleTimeDays,
        EventsView.avgOfferPeriodDays,
        EventsView.invitedSuppliersCount,
        EventsView.offeredSuppliersCount,
        EventsView.viewedSuppliersCount,
        EventsView.rejectedSuppliersCount
      ],
      dimensions: [
        EventsView.number,
        EventsView.createdBy,
        EventsView.currentStateId,
        EventsView.purchaseOrganisation
      ],
      timeDimension: EventsView.createdAt,
      granularity: `day`,
      refreshKey: {
        every: `1 hour`
      }
    },
    byCreator: {
      measures: [
        EventsView.count,
        EventsView.avgQuotationRate,
        EventsView.avgCycleTimeDays
      ],
      dimensions: [EventsView.createdBy],
      timeDimension: EventsView.createdAt,
      granularity: `month`
    }
  },

  joins: {
    // Join to state tables to get state names
    StateMaterialRfq: {
      sql: `${CUBE}.current_state_id = ${StateMaterialRfq}.id AND ${CUBE}.event_type = 'RFQ'`,
      relationship: `belongsTo`
    },
    StateRequestForInformation: {
      sql: `${CUBE}.current_state_id = ${StateRequestForInformation}.id AND ${CUBE}.event_type = 'RFI'`,
      relationship: `belongsTo`
    },
    
    // Join to appropriate supplier table based on event_type
    RequestForToSupplierMaterialRfq: {
      sql: `${CUBE}.id = ${RequestForToSupplierMaterialRfq}.parent_id AND ${CUBE}.event_type = 'RFQ'`,
      relationship: `hasMany`
    },
    RequestForToSupplierRfi: {
      sql: `${CUBE}.id = ${RequestForToSupplierRfi}.parent_id AND ${CUBE}.event_type = 'RFI'`,
      relationship: `hasMany`
    },
    Quotation: {
      sql: `${CUBE}.id = ${Quotation}.request_for_id`,
      relationship: `hasMany`
    },
    Order: {
      sql: `EXISTS(
        SELECT 1 FROM public.quotation q
        JOIN public."order" o ON o.source_document_id = q.id
        WHERE q.request_for_id = ${CUBE}.id
      )`,
      relationship: `hasMany`
    }
  },

  measures: {
    // ===== COUNT MEASURES =====
    count: {
      type: `count`,
      drillMembers: [number, name, eventType, createdAt, createdBy]
    },
    
    invitedSuppliersCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${RequestForToSupplierMaterialRfq.id}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${RequestForToSupplierRfi.id}
        END`,
      type: `countDistinct`,
      title: `Number of Invited Suppliers`
    },
    
    viewedSuppliersCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' AND ${RequestForToSupplierMaterialRfq.hasActiveStatusChanged} = true THEN ${RequestForToSupplierMaterialRfq.id}
          WHEN ${CUBE}.event_type = 'RFI' AND ${RequestForToSupplierRfi.hasActiveStatusChanged} = true THEN ${RequestForToSupplierRfi.id}
        END`,
      type: `countDistinct`,
      title: `Number of Suppliers (Viewed)`
    },
    
    offeredSuppliersCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' AND ${Quotation.submittedAt} IS NOT NULL THEN ${RequestForToSupplierMaterialRfq.id}
          WHEN ${CUBE}.event_type = 'RFI' AND ${Quotation.submittedAt} IS NOT NULL THEN ${RequestForToSupplierRfi.id}
        END`,
      type: `countDistinct`,
      title: `Number of Suppliers (Offered/Submitted)`
    },
    
    rejectedSuppliersCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' AND ${RequestForToSupplierMaterialRfq.isActive} = false THEN ${RequestForToSupplierMaterialRfq.id}
          WHEN ${CUBE}.event_type = 'RFI' AND ${RequestForToSupplierRfi.isActive} = false THEN ${RequestForToSupplierRfi.id}
        END`,
      type: `countDistinct`,
      title: `Number of Suppliers (Rejected)`
    },
    
    // ===== KPI MEASURES - TIME-BASED =====
    
    offerPeriodDays: {
      sql: `
        CASE 
          WHEN ${CUBE}.started_date IS NOT NULL AND ${CUBE}.deadline IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.started_date)) / 86400
          ELSE NULL
        END`,
      type: `number`,
      format: `number`,
      title: `Offer Period (Days)`,
      description: `Time between event start and submission deadline`
    },
    
    avgOfferPeriodDays: {
      sql: `offerPeriodDays`,
      type: `avg`,
      format: `number`,
      title: `Average Offer Period (Days)`
    },
    
    cycleTimeDays: {
      sql: `
        CASE 
          WHEN ${CUBE}.created_at IS NOT NULL AND ${CUBE}.replies_opened_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (${CUBE}.replies_opened_at - ${CUBE}.created_at)) / 86400
          ELSE NULL
        END`,
      type: `number`,
      format: `number`,
      title: `Cycle Time (Days)`,
      description: `Time from event creation to replies opening`
    },
    
    avgCycleTimeDays: {
      sql: `cycleTimeDays`,
      type: `avg`,
      format: `number`,
      title: `Average Cycle Time (Days)`
    },
    
    // ===== KPI MEASURES - RATES =====
    
    quotationRate: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN
            CASE WHEN COUNT(DISTINCT ${RequestForToSupplierMaterialRfq.id}) > 0 
            THEN (
              COUNT(DISTINCT CASE WHEN ${Quotation.submittedAt} IS NOT NULL 
                                  AND ${Quotation.originalQuotationId} IS NULL 
                             THEN ${RequestForToSupplierMaterialRfq.id} END)::FLOAT / 
              COUNT(DISTINCT ${RequestForToSupplierMaterialRfq.id})
            ) * 100 
            ELSE 0 END
          WHEN ${CUBE}.event_type = 'RFI' THEN
            CASE WHEN COUNT(DISTINCT ${RequestForToSupplierRfi.id}) > 0 
            THEN (
              COUNT(DISTINCT CASE WHEN ${Quotation.submittedAt} IS NOT NULL 
                                  AND ${Quotation.originalQuotationId} IS NULL 
                             THEN ${RequestForToSupplierRfi.id} END)::FLOAT / 
              COUNT(DISTINCT ${RequestForToSupplierRfi.id})
            ) * 100 
            ELSE 0 END
        END`,
      type: `number`,
      format: `percent`,
      title: `Quotation Rate (%)`,
      description: `Number of valid quotations / Number of invited suppliers * 100`
    },
    
    avgQuotationRate: {
      sql: `quotationRate`,
      type: `avg`,
      format: `percent`,
      title: `Average Quotation Rate (%)`
    },
    
    responseRate: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN
            CASE WHEN COUNT(DISTINCT ${RequestForToSupplierMaterialRfq.id}) > 0 
            THEN (
              COUNT(DISTINCT CASE WHEN ${RequestForToSupplierMaterialRfq.hasActiveStatusChanged} = true 
                             THEN ${RequestForToSupplierMaterialRfq.id} END)::FLOAT / 
              COUNT(DISTINCT ${RequestForToSupplierMaterialRfq.id})
            ) * 100 
            ELSE 0 END
          WHEN ${CUBE}.event_type = 'RFI' THEN
            CASE WHEN COUNT(DISTINCT ${RequestForToSupplierRfi.id}) > 0 
            THEN (
              COUNT(DISTINCT CASE WHEN ${RequestForToSupplierRfi.hasActiveStatusChanged} = true 
                             THEN ${RequestForToSupplierRfi.id} END)::FLOAT / 
              COUNT(DISTINCT ${RequestForToSupplierRfi.id})
            ) * 100 
            ELSE 0 END
        END`,
      type: `number`,
      format: `percent`,
      title: `Response Rate (%)`,
      description: `Number of answers / Number of invited suppliers * 100`
    },
    
    rejectRate: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN
            CASE WHEN COUNT(DISTINCT ${RequestForToSupplierMaterialRfq.id}) > 0 
            THEN (
              COUNT(DISTINCT CASE WHEN ${RequestForToSupplierMaterialRfq.isActive} = false 
                             THEN ${RequestForToSupplierMaterialRfq.id} END)::FLOAT / 
              COUNT(DISTINCT ${RequestForToSupplierMaterialRfq.id})
            ) * 100 
            ELSE 0 END
          WHEN ${CUBE}.event_type = 'RFI' THEN
            CASE WHEN COUNT(DISTINCT ${RequestForToSupplierRfi.id}) > 0 
            THEN (
              COUNT(DISTINCT CASE WHEN ${RequestForToSupplierRfi.isActive} = false 
                             THEN ${RequestForToSupplierRfi.id} END)::FLOAT / 
              COUNT(DISTINCT ${RequestForToSupplierRfi.id})
            ) * 100 
            ELSE 0 END
        END`,
      type: `number`,
      format: `percent`,
      title: `Reject Rate (%)`,
      description: `Number of rejected suppliers / Number of invited suppliers * 100`
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true
    },
    
    // Event type dimension (RFQ, RFI, RFP, eAuction)
    eventType: {
      sql: `event_type`,
      type: `string`,
      title: `Event Type`
    },
    
    number: {
      sql: `"number"`,
      type: `string`,
      title: `Event Number`
    },
    
    // Alias for backward compatibility
    rfqNo: {
      sql: `"number"`,
      type: `string`,
      title: `Event Number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `Event Name`
    },
    
    // Alias for backward compatibility
    rfqName: {
      sql: `name`,
      type: `string`,
      title: `Event Name`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Status ID`
    },
    
    // State name from joined state tables
    stateName: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${StateMaterialRfq.name}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${StateRequestForInformation.name}
        END`,
      type: `string`,
      title: `Status Name`
    },
    
    // Alias for backend compatibility
    status: {
      sql: `current_state_id`,
      type: `string`,
      title: `Status`
    },
    
    // Organization fields (RFQ only)
    purchaseOrganisation: {
      sql: `purchase_organisation`,
      type: `string`,
      title: `Purchase Organisation`
    },
    
    companyCode: {
      sql: `company_code`,
      type: `string`,
      title: `Company Code`
    },
    
    purchaseGroup: {
      sql: `purchase_group`,
      type: `string`,
      title: `Purchase Group`
    },
    
    // Contact fields
    commercialContact: {
      sql: `commercial_contact`,
      type: `string`,
      title: `Commercial Contact`
    },
    
    technicalContact: {
      sql: `technical_contact`,
      type: `string`,
      title: `Technical Contact`
    },
    
    // Creator fields
    createdBy: {
      sql: `created_by`,
      type: `string`,
      title: `Created By`
    },
    
    // Aliases for backend compatibility
    creatorName: {
      sql: `created_by`,
      type: `string`,
      title: `Creator Name`
    },
    
    creatorId: {
      sql: `created_by`,
      type: `string`,
      title: `Creator ID`
    },
    
    domain: {
      sql: `domain`,
      type: `string`
    },
    
    currency: {
      sql: `currency`,
      type: `string`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `number`,
      format: `currency`
    },
    
    roundNumber: {
      sql: `round_number`,
      type: `number`,
      title: `Number of Rounds`
    },
    
    // Alias for backend compatibility
    numberOfRounds: {
      sql: `round_number`,
      type: `number`,
      title: `Number of Rounds`
    },
    
    documentLanguage: {
      sql: `document_language`,
      type: `string`
    },
    
    // Dates
    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`
    },
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`
    },
    
    startedDate: {
      sql: `started_date`,
      type: `time`,
      title: `Started/Published At`
    },
    
    // Alias for backend compatibility
    startedAt: {
      sql: `started_date`,
      type: `time`,
      title: `Started/Published At`
    },
    
    deadline: {
      sql: `deadline`,
      type: `time`,
      title: `Submission Deadline`
    },
    
    // Alias for backend compatibility
    submissionDeadline: {
      sql: `deadline`,
      type: `time`,
      title: `Submission Deadline`
    },
    
    repliesOpenedAt: {
      sql: `replies_opened_at`,
      type: `time`,
      title: `Replies Opened At`
    },
    
    repliesOpenedBy: {
      sql: `replies_opened_by`,
      type: `string`
    },
    
    // Boolean flags
    isInEditMode: {
      sql: `is_in_edit_mode`,
      type: `boolean`
    },
    
    hasDocumentChanged: {
      sql: `has_document_changed`,
      type: `boolean`
    },
    
    hasDeadlineChanged: {
      sql: `has_deadline_changed`,
      type: `boolean`
    },
    
    // All dimensions from MaterialRfq are inherited via extends
    // Adding additional computed dimensions if needed
    
    hasOrders: {
      sql: `EXISTS(
        SELECT 1 FROM public.quotation q
        JOIN public."order" o ON o.source_document_id = q.id
        WHERE q.request_for_id = ${CUBE}.id
      )`,
      type: `boolean`,
      title: `Has Orders/Awards`
    },
    
    awardedAt: {
      sql: `(
        SELECT MIN(o.created_at)
        FROM public."order" o
        JOIN public.quotation q ON o.source_document_id = q.id
        WHERE q.request_for_id = ${CUBE}.id
      )`,
      type: `time`,
      title: `Awarded At (First Order Date)`
    }
  }
});
