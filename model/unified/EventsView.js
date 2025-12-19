cube(`EventsView`, {
  sql: `
    SELECT
      id,
      'RFQ' as event_type,
      "number" as event_number,
      name,
      short_description,
      current_state_id,
      purchase_organisation::jsonb->>'Code' as purchase_organisation,
          company_code::jsonb->>'Code' as company_code,
          purchase_group::jsonb->>'Code' as purchase_group,
          (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') as commercial_contact,
          NULL as technical_contact,
          (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') as created_by,
          created_by::jsonb->>'UserId' as created_by_user_id,
          (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') as updated_by,
          created_at,
          updated_at,
          started_date,
          deadline,
          replies_opened_at,
          (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') as replies_opened_by,
          domain,
          currency,
          total_price,
          round_number,
          document_language,
          is_in_edit_mode,
          has_document_changed,
          has_deadline_changed,
          (SELECT MIN(o.created_at)
           FROM buyer_d_fdw_order_service."order" o
           JOIN buyer_d_fdw_rfq_service.quotation q ON o.source_document_id = q.id
           WHERE q.request_for_id = material_rfq.id) as awarded_at,
          
          -- Standardized Supplier Counts
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts WHERE rfts.parent_id = material_rfq.id) as invited_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts WHERE rfts.parent_id = material_rfq.id AND rfts.has_active_status_changed = true) as viewed_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts WHERE rfts.parent_id = material_rfq.id AND EXISTS (SELECT 1 FROM buyer_d_fdw_rfq_service.quotation q WHERE q.request_for_to_supplier_id = rfts.id AND q.request_for_id = material_rfq.id AND q.submitted_at IS NOT NULL AND q.original_quotation_id = '00000000-0000-0000-0000-000000000000')) as offered_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s ON rfts.current_state_id = s.id WHERE rfts.parent_id = material_rfq.id AND LOWER(s.name) = 'rejected') as rejected_suppliers_count,
          
          -- Standardized Financials (RFQ Only)
          (SELECT MIN(total_price) FROM buyer_d_fdw_rfq_service.quotation q WHERE q.request_for_id = material_rfq.id AND q.is_opened = true AND q.round_number = material_rfq.round_number AND NOT EXISTS (SELECT 1 FROM buyer_d_fdw_rfq_service.quotation_document_item qdi WHERE qdi.root_id = q.id AND qdi.unit_price <= 0 AND qdi.item_type <> 3)) as best_quotation_total,
          (SELECT SUM(total_price) FROM buyer_d_fdw_rfq_service.quotation q WHERE q.request_for_id = material_rfq.id AND q.is_opened = true AND q.round_number = material_rfq.round_number AND NOT EXISTS (SELECT 1 FROM buyer_d_fdw_rfq_service.quotation_document_item qdi WHERE qdi.root_id = q.id AND qdi.unit_price <= 0 AND qdi.item_type <> 3)) as quotation_total_sum,
          (SELECT COUNT(*) FROM buyer_d_fdw_rfq_service.quotation q WHERE q.request_for_id = material_rfq.id AND q.is_opened = true AND q.round_number = material_rfq.round_number AND NOT EXISTS (SELECT 1 FROM buyer_d_fdw_rfq_service.quotation_document_item qdi WHERE qdi.root_id = q.id AND qdi.unit_price <= 0 AND qdi.item_type <> 3)) as quotation_count_valid
    FROM buyer_d_fdw_rfq_service.material_rfq

    UNION ALL

    SELECT
      id,
      'RFI' as event_type,
      "number" as event_number,
      name,
      short_description,
      current_state_id,
      NULL as purchase_organisation,
      NULL as company_code,
      NULL as purchase_group,
      (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') as commercial_contact,
      (technical_contact::jsonb->>'FirstName') || ' ' || (technical_contact::jsonb->>'LastName') as technical_contact,
      (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') as created_by,
      created_by::jsonb->>'UserId' as created_by_user_id,
          (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') as updated_by,
          created_at,
          updated_at,
          started_date,
          deadline,
          replies_opened_at,
          (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') as replies_opened_by,
          domain,
          NULL as currency,
          NULL as total_price,
          round_number,
          document_language,
          is_in_edit_mode,
          has_document_changed,
          has_deadline_changed,
          NULL as awarded_at,
          
          -- Standardized Supplier Counts
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts WHERE rfts.parent_id = request_for_information.id) as invited_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts WHERE rfts.parent_id = request_for_information.id AND rfts.has_active_status_changed = true) as viewed_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts WHERE rfts.parent_id = request_for_information.id AND EXISTS (SELECT 1 FROM buyer_d_fdw_rfq_service.quotation q WHERE q.request_for_to_supplier_id = rfts.id AND q.request_for_id = request_for_information.id AND q.submitted_at IS NOT NULL AND q.original_quotation_id = '00000000-0000-0000-0000-000000000000')) as offered_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_request_for_information s ON rfts.current_state_id = s.id WHERE rfts.parent_id = request_for_information.id AND LOWER(s.name) = 'rejected') as rejected_suppliers_count,
          
          -- Standardized Financials (RFI has none)
          NULL as best_quotation_total,
          NULL as quotation_total_sum,
          NULL as quotation_count_valid
    FROM buyer_d_fdw_rfq_service.request_for_information
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
        EventsView.purchaseOrganisation,
        EventsView.eventType
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

    // Join to User table for creator department
    User: {
      sql: `${CUBE}.created_by_user_id::uuid = ${User}.id`,
      relationship: `belongsTo`
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [number, name, eventType, createdAt, createdBy]
    },

    invitedSuppliersCount: {
      sql: `invited_suppliers_count`,
      type: `max`,
      title: `Number of Invited Suppliers`
    },

    viewedSuppliersCount: {
      sql: `viewed_suppliers_count`,
      type: `max`,
      title: `Number of Suppliers (Viewed)`
    },

    offeredSuppliersCount: {
      sql: `offered_suppliers_count`,
      type: `max`,
      title: `Number of Suppliers (Offered/Submitted)`
    },

    rejectedSuppliersCount: {
      sql: `rejected_suppliers_count`,
      type: `max`,
      title: `Number of Suppliers (Rejected)`
    },
    
    // KPI measures - TIME-BASED
    offerPeriodDays: {
      sql: `
            CASE 
              WHEN ${CUBE}.started_date IS NOT NULL AND ${CUBE}.deadline IS NOT NULL 
              THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.started_date)) / 86400)
              ELSE NULL
            END`,
      type: `max`,
      format: `number`,
      title: `Offer Period (Days)`,
      description: `Time between event start and submission deadline`
    },

    avgOfferPeriodDays: {
      sql: `
            CASE 
              WHEN ${CUBE}.started_date IS NOT NULL AND ${CUBE}.deadline IS NOT NULL 
              THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.started_date)) / 86400)
              ELSE NULL
            END`,
      type: `avg`,
      format: `number`,
      title: `Average Offer Period (Days)`
    },

    cycleTimeDays: {
      sql: `
            CASE
              WHEN ${CUBE}.awarded_at IS NOT NULL AND ${CUBE}.started_date IS NOT NULL
              THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.awarded_at - ${CUBE}.started_date)) / 86400)
              ELSE NULL
            END`,
      type: `max`,
      format: `number`,
      title: `Cycle Time (Days)`,
      description: `Time from event start to award decision (first order/contract created)`
    },

    avgCycleTimeDays: {
      sql: `
            CASE
              WHEN ${CUBE}.awarded_at IS NOT NULL AND ${CUBE}.started_date IS NOT NULL
              THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.awarded_at - ${CUBE}.started_date)) / 86400)
              ELSE NULL
            END`,
      type: `avg`,
      format: `number`,
      title: `Average Cycle Time (Days)`,
      description: `Average time from event start to award decision`
    },
    
    // KPI measures - RATES
    quotationRate: {
      sql: `CASE WHEN ${CUBE}.invited_suppliers_count > 0 THEN (${CUBE}.offered_suppliers_count::FLOAT / ${CUBE}.invited_suppliers_count) * 100 ELSE 0 END`,
      type: `max`,
      format: `percent`,
      title: `Quotation Rate (%)`,
      description: `Number of valid quotations / Number of invited suppliers * 100`
    },

    avgQuotationRate: {
      sql: `CASE WHEN ${CUBE}.invited_suppliers_count > 0 THEN (${CUBE}.offered_suppliers_count::FLOAT / ${CUBE}.invited_suppliers_count) * 100 ELSE 0 END`,
      type: `avg`,
      format: `percent`,
      title: `Average Quotation Rate (%)`
    },

    responseRate: {
      sql: `CASE WHEN ${CUBE}.invited_suppliers_count > 0 THEN (${CUBE}.viewed_suppliers_count::FLOAT / ${CUBE}.invited_suppliers_count) * 100 ELSE 0 END`,
      type: `max`,
      format: `percent`,
      title: `Response Rate (%)`,
      description: `Number of answers / Number of invited suppliers * 100`
    },

    rejectRate: {
      sql: `CASE WHEN ${CUBE}.invited_suppliers_count > 0 THEN (${CUBE}.rejected_suppliers_count::FLOAT / ${CUBE}.invited_suppliers_count) * 100 ELSE 0 END`,
      type: `max`,
      format: `percent`,
      title: `Reject Rate (%)`,
      description: `Number of rejected suppliers / Number of invited suppliers * 100`
    },
    
    // KPI measures - FINANCIALS
    bestQuotationTotal: {
      sql: `best_quotation_total`,
      type: `max`,
      format: `currency`,
      title: `Best Quotation Total`,
      description: `Lowest opened quotation from latest round (excludes quotations with invalid pricing)`
    },

    quotationTotalAvg: {
      sql: `CASE WHEN ${CUBE}.quotation_count_valid > 0 THEN ${CUBE}.quotation_total_sum / ${CUBE}.quotation_count_valid ELSE NULL END`,
      type: `max`,
      format: `currency`,
      title: `Quotation Total (Average)`
    },

    quotationTotal: {
      sql: `quotation_total_sum`,
      type: `max`,
      format: `currency`,
      title: `Quotation Total`
    },

    openedQuotationsCount: {
      sql: `
        (
          SELECT COUNT(DISTINCT q.id)
          FROM buyer_d_fdw_rfq_service.quotation q
          WHERE q.request_for_id = ${CUBE}.id
        )
      `,
      type: `max`,
      title: `Opened Quotations Count`
    },

    lastRoundNumber: {
      sql: `${CUBE}.round_number`,
      type: `max`,
      title: `Last Round Number`
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true
    },

    eventType: {
      sql: `event_type`,
      type: `string`,
      title: `Event Type`
    },

    number: {
      sql: `"event_number"`,
      type: `string`,
      title: `Event Number`
    },

    name: {
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

    createdBy: {
      sql: `created_by`,
      type: `string`,
      title: `Created By`
    },

    updatedBy: {
      sql: `updated_by`,
      type: `string`,
      title: `Updated By`
    },

    creatorDepartment: {
      sql: `${User.department}`,
      type: `string`,
      title: `Department (Creator)`
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
    
    deadline: {
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

    awardedAt: {
      sql: `awarded_at`,
      type: `time`,
      title: `Awarded At (First Order Date)`
    }
  }
});
