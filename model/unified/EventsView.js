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
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts WHERE rfts.parent_id = material_rfq.id AND rfts.is_active = true) as invited_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s ON rfts.current_state_id = s.id WHERE rfts.parent_id = material_rfq.id AND s.name = 'Seen') as viewed_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s ON rfts.current_state_id = s.id WHERE rfts.parent_id = material_rfq.id AND s.name = 'SupplierReplySubmitted') as offered_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s ON rfts.current_state_id = s.id WHERE rfts.parent_id = material_rfq.id AND s.name = 'Rejected') as rejected_suppliers_count,
          
          -- Standardized Financials (RFQ Only)
          (SELECT MIN(total_price) FROM buyer_d_fdw_rfq_service.quotation q WHERE q.request_for_id = material_rfq.id AND q.is_opened = true AND q.round_number = material_rfq.round_number AND q.version_number = 0 AND NOT EXISTS (SELECT 1 FROM buyer_d_fdw_rfq_service.quotation_document_item qdi WHERE qdi.root_id = q.id AND qdi.unit_price <= 0 AND qdi.item_type <> 3)) as best_quotation_total,
          (SELECT SUM(total_price) FROM buyer_d_fdw_rfq_service.quotation q WHERE q.request_for_id = material_rfq.id AND q.is_opened = true AND q.round_number = material_rfq.round_number AND q.version_number = 0 AND NOT EXISTS (SELECT 1 FROM buyer_d_fdw_rfq_service.quotation_document_item qdi WHERE qdi.root_id = q.id AND qdi.unit_price <= 0 AND qdi.item_type <> 3)) as quotation_total_sum,
          (SELECT COUNT(*) FROM buyer_d_fdw_rfq_service.quotation q WHERE q.request_for_id = material_rfq.id AND q.is_opened = true AND q.round_number = material_rfq.round_number AND q.version_number = 0 AND NOT EXISTS (SELECT 1 FROM buyer_d_fdw_rfq_service.quotation_document_item qdi WHERE qdi.root_id = q.id AND qdi.unit_price <= 0 AND qdi.item_type <> 3)) as quotation_count_valid
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
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts WHERE rfts.parent_id = request_for_information.id AND rfts.is_active = true) as invited_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_request_for_information s ON rfts.current_state_id = s.id WHERE rfts.parent_id = request_for_information.id AND s.name = 'Seen') as viewed_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_request_for_information s ON rfts.current_state_id = s.id WHERE rfts.parent_id = request_for_information.id AND s.name = 'SupplierReplySubmitted') as offered_suppliers_count,
          (SELECT COUNT(DISTINCT rfts.id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_request_for_information s ON rfts.current_state_id = s.id WHERE rfts.parent_id = request_for_information.id AND s.name = 'Rejected') as rejected_suppliers_count,
          
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
        EventsView.invitedSuppliersCount,
        EventsView.offeredSuppliersCount,
        EventsView.viewedSuppliersCount,
        EventsView.rejectedSuppliersCount,
        EventsView.quotationTotal,
        EventsView.quotationCountValid
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
        EventsView.invitedSuppliersCount,
        EventsView.offeredSuppliersCount
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
      title: `Event Count`,
      drillMembers: [number, name, eventType, createdAt, createdBy]
    },

    invitedSuppliersCount: {
      sql: `invited_suppliers_count`,
      type: `sum`,
      title: `Invited Suppliers`
    },

    viewedSuppliersCount: {
      sql: `viewed_suppliers_count`,
      type: `sum`,
      title: `Viewed Suppliers`
    },

    offeredSuppliersCount: {
      sql: `offered_suppliers_count`,
      type: `sum`,
      title: `Offered Suppliers`
    },

    rejectedSuppliersCount: {
      sql: `rejected_suppliers_count`,
      type: `sum`,
      title: `Rejected Suppliers`
    },

    quotationTotal: {
      sql: `quotation_total_sum`,
      type: `sum`,
      format: `currency`,
      title: `Quotation Total`
    },

    quotationCountValid: {
      sql: `quotation_count_valid`,
      type: `sum`,
      title: `Valid Quotations Count`
    },

    // Time KPIs
    offerPeriodDays: {
      sql: `
        CASE
          WHEN ${CUBE}.started_date IS NOT NULL
           AND ${CUBE}.deadline IS NOT NULL
          THEN EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.started_date)) / 86400
          ELSE NULL
        END
      `,
      type: `avg`,
      title: `Offer Period (Days)`
    },

    cycleTimeDays: {
      sql: `
        CASE
          WHEN ${CUBE}.started_date IS NOT NULL
           AND ${CUBE}.awarded_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (${CUBE}.awarded_at - ${CUBE}.started_date)) / 86400
          ELSE NULL
        END
      `,
      type: `avg`,
      title: `Cycle Time (Days)`
    },

    // Rate KPIs
    quotationRate: {
      sql: `
        CASE
          WHEN ${invitedSuppliersCount} > 0
          THEN ${offeredSuppliersCount}::FLOAT / ${invitedSuppliersCount}
          ELSE NULL
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Quotation Rate`
    },

    responseRate: {
      sql: `
        CASE
          WHEN ${invitedSuppliersCount} > 0
          THEN ${viewedSuppliersCount}::FLOAT / ${invitedSuppliersCount}
          ELSE 0
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Response Rate`
    },

    rejectRate: {
      sql: `
        CASE
          WHEN ${invitedSuppliersCount} > 0
          THEN ${rejectedSuppliersCount}::FLOAT / ${invitedSuppliersCount}
          ELSE 0
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Reject Rate`
    },

    // Financial KPIs
    bestQuotationTotal: {
      sql: `best_quotation_total`,
      type: `min`,
      format: `currency`,
      title: `Best Quotation (Lowest)`
    },

    quotationTotalAvg: {
      sql: `
        CASE
          WHEN ${quotationCountValid} > 0
          THEN ${quotationTotal}::FLOAT / ${quotationCountValid}
          ELSE NULL
        END
      `,
      type: `number`,
      format: `currency`,
      title: `Average Quotation Total`
    }
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
