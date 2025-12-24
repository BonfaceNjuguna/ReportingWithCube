// Thin harmonized event union (RFQ + RFI) with no KPIs. Use EventsKPIView for business metrics.
cube(`EventBase`, {
  sql: `
    SELECT
      id,
      'RFQ' AS event_type,
      "number" AS event_number,
      name,
      short_description,
      current_state_id,
      purchase_organisation::jsonb->>'Code' AS purchase_organisation,
      company_code::jsonb->>'Code' AS company_code,
      purchase_group::jsonb->>'Code' AS purchase_group,
      (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') AS commercial_contact,
      NULL AS technical_contact,
      (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') AS created_by,
      created_by::jsonb->>'UserId' AS created_by_user_id,
      (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') AS updated_by,
      created_at,
      updated_at,
      started_date,
      deadline,
      replies_opened_at,
      (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') AS replies_opened_by,
      domain,
      currency,
      total_price,
      round_number,
      document_language,
      is_in_edit_mode,
      has_document_changed,
      has_deadline_changed
    FROM buyer_d_fdw_rfq_service.material_rfq

    UNION ALL

    SELECT
      id,
      'RFI' AS event_type,
      "number" AS event_number,
      name,
      short_description,
      current_state_id,
      NULL AS purchase_organisation,
      NULL AS company_code,
      NULL AS purchase_group,
      (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') AS commercial_contact,
      (technical_contact::jsonb->>'FirstName') || ' ' || (technical_contact::jsonb->>'LastName') AS technical_contact,
      (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') AS created_by,
      created_by::jsonb->>'UserId' AS created_by_user_id,
      (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') AS updated_by,
      created_at,
      updated_at,
      started_date,
      deadline,
      replies_opened_at,
      (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') AS replies_opened_by,
      domain,
      NULL AS currency,
      NULL AS total_price,
      round_number,
      document_language,
      is_in_edit_mode,
      has_document_changed,
      has_deadline_changed
    FROM buyer_d_fdw_rfq_service.request_for_information
  `,

  joins: {
    StateMaterialRfq: {
      sql: `${CUBE}.current_state_id = ${StateMaterialRfq}.id AND ${CUBE}.event_type = 'RFQ'`,
      relationship: `belongsTo`
    },
    StateRequestForInformation: {
      sql: `${CUBE}.current_state_id = ${StateRequestForInformation}.id AND ${CUBE}.event_type = 'RFI'`,
      relationship: `belongsTo`
    },
    User: {
      sql: `${CUBE}.created_by_user_id::uuid = ${User}.id`,
      relationship: `belongsTo`
    },
    MaterialRfq: {
      sql: `${CUBE}.id = ${MaterialRfq}.id AND ${CUBE}.event_type = 'RFQ'`,
      relationship: `belongsTo`
    },
    RequestForInformation: {
      sql: `${CUBE}.id = ${RequestForInformation}.id AND ${CUBE}.event_type = 'RFI'`,
      relationship: `belongsTo`
    }
  },

  measures: {
    count: {
      type: `count`,
      title: `Event Count`,
      drillMembers: [number, name, eventType, createdAt, createdBy]
    },

    rfqTotalPrice: {
      sql: `CASE WHEN ${CUBE}.event_type = 'RFQ' THEN total_price ELSE NULL END`,
      type: `sum`,
      format: `currency`,
      title: `RFQ Total Price`
    },

    // Supplier KPIs - delegates to appropriate cube based on event type
    invitedSuppliersCount: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.invitedSuppliersCount}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${RequestForInformation.invitedSuppliersCount}
        END
      `,
      type: `number`,
      title: `Invited Suppliers`
    },

    viewedSuppliersCount: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.viewedSuppliersCount}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${RequestForInformation.viewedSuppliersCount}
        END
      `,
      type: `number`,
      title: `Viewed Suppliers`
    },

    offeredSuppliersCount: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.offeredSuppliersCount}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${RequestForInformation.offeredSuppliersCount}
        END
      `,
      type: `number`,
      title: `Offered Suppliers`
    },

    rejectedSuppliersCount: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.rejectedSuppliersCount}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${RequestForInformation.rejectedSuppliersCount}
        END
      `,
      type: `number`,
      title: `Rejected Suppliers`
    },

    // Financial KPIs - RFQ only
    quotationTotal: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.quotationTotal}
          ELSE NULL
        END
      `,
      type: `number`,
      format: `currency`,
      title: `Quotation Total`
    },

    quotationCountValid: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.quotationCountValid}
          ELSE NULL
        END
      `,
      type: `number`,
      title: `Valid Quotations Count`
    },

    bestQuotationTotal: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.bestQuotationTotal}
          ELSE NULL
        END
      `,
      type: `number`,
      format: `currency`,
      title: `Best Quotation (Lowest)`
    },

    quotationTotalAvg: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.quotationTotalAvg}
          ELSE NULL
        END
      `,
      type: `number`,
      format: `currency`,
      title: `Average Quotation Total`
    },

    // Time-based KPIs
    offerPeriodDays: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.offerPeriodDays}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${RequestForInformation.offerPeriodDays}
        END
      `,
      type: `number`,
      title: `Offer Period (Days)`
    },

    cycleTimeDays: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.cycleTimeDays}
          ELSE NULL
        END
      `,
      type: `number`,
      title: `Cycle Time (Days)`
    },

    // Rate KPIs
    quotationRate: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.quotationRate}
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
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.responseRate}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${RequestForInformation.responseRate}
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Response Rate`
    },

    rejectRate: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${MaterialRfq.rejectRate}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${RequestForInformation.rejectRate}
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Reject Rate`
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

    stateName: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${StateMaterialRfq.name}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${StateRequestForInformation.name}
        END`,
      type: `string`,
      title: `Status Name`
    },

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

    createdByUserId: {
      sql: `created_by_user_id`,
      type: `string`,
      title: `Created By User ID`
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

    documentLanguage: {
      sql: `document_language`,
      type: `string`
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
    }
  }
});
