// Cube.js schema for Request for Information (RFI)
// Maps to: buyer_d_fdw_rfq_service.request_for_information

cube(`RequestForInformation`, {
  sql: `SELECT * FROM buyer_d_fdw_rfq_service.request_for_information`,
  
  preAggregations: {
    main: {
      measures: [
        RequestForInformation.count
      ],
      dimensions: [
        RequestForInformation.number,
        RequestForInformation.createdBy,
        RequestForInformation.currentStateId
      ],
      timeDimension: RequestForInformation.createdAt,
      granularity: `day`,
      refreshKey: {
        every: `1 hour`
      }
    }
  },

  joins: {
    RequestForToSupplierRfi: {
      sql: `${CUBE}.id = ${RequestForToSupplierRfi}.parent_id`,
      relationship: `hasMany`
    },
    Quotation: {
      sql: `${CUBE}.id = ${Quotation}.request_for_id`,
      relationship: `hasMany`
    },
    StateRequestForInformation: {
      sql: `${CUBE}.current_state_id = ${StateRequestForInformation}.id`,
      relationship: `belongsTo`
    },
    StateRequestForToSupplierRfi: {
      relationship: `belongsTo`,
      sql: `${RequestForToSupplierRfi}.current_state_id = ${StateRequestForToSupplierRfi}.id`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [number, name, createdAt, createdBy]
    },

    // Supplier KPIs
    invitedSuppliersCount: {
      sql: `${RequestForToSupplierRfi.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${RequestForToSupplierRfi}.is_active = true` }],
      title: `Invited Suppliers`
    },

    viewedSuppliersCount: {
      sql: `${RequestForToSupplierRfi.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierRfi}.name = 'Seen'` }],
      title: `Viewed Suppliers`
    },

    offeredSuppliersCount: {
      sql: `${RequestForToSupplierRfi.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierRfi}.name = 'SupplierReplySubmitted'` }],
      title: `Offered Suppliers`
    },

    rejectedSuppliersCount: {
      sql: `${RequestForToSupplierRfi.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierRfi}.name = 'Rejected'` }],
      title: `Rejected Suppliers`
    },

    // Rate KPIs
    responseRate: {
      sql: `
        CASE
          WHEN ${invitedSuppliersCount} > 0
          THEN ${viewedSuppliersCount}::FLOAT / ${invitedSuppliersCount}
          ELSE NULL
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
          ELSE NULL
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Reject Rate`
    },

    // Time-based KPIs
    offerPeriodDays: {
      sql: `
        CASE
          WHEN ${CUBE.startedDate} IS NOT NULL
           AND ${CUBE.deadline} IS NOT NULL
          THEN EXTRACT(EPOCH FROM (${CUBE.deadline} - ${CUBE.startedDate})) / 86400
          ELSE NULL
        END
      `,
      type: `avg`,
      title: `Offer Period (Days)`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true
    },
    
    number: {
      sql: `"number"`,
      type: `string`,
      title: `RFI Number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `RFI Name`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Status`
    },
    
    domain: {
      sql: `domain`,
      type: `string`
    },
    
    // Contact fields
    commercialContact: {
      sql: `(commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName')`,
      type: `string`,
      title: `Commercial Contact`
    },
    
    commercialContactEmail: {
      sql: `commercial_contact::jsonb->>'Email'`,
      type: `string`,
      title: `Commercial Contact Email`
    },
    
    commercialContactId: {
      sql: `commercial_contact::jsonb->>'Id'`,
      type: `string`,
      title: `Commercial Contact ID`
    },
    
    technicalContact: {
      sql: `(technical_contact::jsonb->>'FirstName') || ' ' || (technical_contact::jsonb->>'LastName')`,
      type: `string`,
      title: `Technical Contact`
    },
    
    technicalContactEmail: {
      sql: `technical_contact::jsonb->>'Email'`,
      type: `string`,
      title: `Technical Contact Email`
    },
    
    technicalContactId: {
      sql: `technical_contact::jsonb->>'Id'`,
      type: `string`,
      title: `Technical Contact ID`
    },
    
    // Creator fields
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`,
      title: `Created By`
    },
    
    createdByUserId: {
      sql: `created_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Created By User ID`
    },
    
    updatedBy: {
      sql: `(updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName')`,
      type: `string`
    },
    
    updatedByUserId: {
      sql: `updated_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Updated By User ID`
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
    
    createdFrom: {
      sql: `created_from`,
      type: `string`
    },
    
    deliveryConditions: {
      sql: `delivery_conditions`,
      type: `string`
    },
    
    paymentTerms: {
      sql: `payment_terms`,
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
      sql: `(replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName')`,
      type: `string`
    },
    
    repliesOpenedByUserId: {
      sql: `replies_opened_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Replies Opened By User ID`
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
    
    hasQuestionnaireQuestionChanged: {
      sql: `has_questionnaire_question_changed`,
      type: `boolean`
    },
    
    lastSubmissionId: {
      sql: `last_submission_id`,
      type: `string`
    }
  }
});
