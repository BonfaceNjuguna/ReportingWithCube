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
        sql: `SELECT MAX(updated_at) FROM buyer_d_fdw_rfq_service.request_for_information`
      }
    },
    byCreatorMonthlyKpis: {
      measures: [
        RequestForInformation.count,
        RequestForInformation.invitedSuppliersCount,
        RequestForInformation.offeredSuppliersCount
      ],
      dimensions: [
        RequestForInformation.domain,
        RequestForInformation.stateName
      ],
      timeDimension: RequestForInformation.createdAt,
      granularity: `month`,
      refreshKey: {
        sql: `SELECT MAX(updated_at) FROM buyer_d_fdw_rfq_service.request_for_information`
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
      drillMembers: [number, name, createdAt, createdBy],
      description: `Total number of RFIs`
    },

    // Supplier KPIs
    invitedSuppliersCount: {
      sql: `${RequestForToSupplierRfi.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${RequestForToSupplierRfi}.is_active = true` }],
      title: `Invited Suppliers`,
      description: `Number of unique suppliers invited to the RFI`
    },

    viewedSuppliersCount: {
      sql: `${RequestForToSupplierRfi.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierRfi}.name = 'Seen'` }],
      title: `Viewed Suppliers`,
      description: `Number of unique suppliers who viewed the RFI`
    },

    offeredSuppliersCount: {
      sql: `${RequestForToSupplierRfi.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierRfi}.name = 'SupplierReplySubmitted'` }],
      title: `Offered Suppliers`,
      description: `Number of unique suppliers who submitted a reply`
    },

    rejectedSuppliersCount: {
      sql: `${RequestForToSupplierRfi.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierRfi}.name = 'Rejected'` }],
      title: `Rejected Suppliers`,
      description: `Number of unique suppliers who rejected the invitation`
    },

    answerCount: {
      sql: `(
        SELECT COUNT(*)
        FROM buyer_d_fdw_rfq_service.questionnaire_answer_request_for_information qa
        JOIN buyer_d_fdw_rfq_service.state_questionnaire_answer_request_for_information sa ON qa.current_state_id = sa.id
        WHERE qa.request_for_id = ${CUBE}.id
          AND sa.name = 'Submitted'
      )`,
      type: `number`,
      title: `Answer Count`,
      description: `Total number of submitted questionnaire answers`
    },

    // Rate KPIs
    responseRate: {
      sql: `
        CASE
          WHEN ${invitedSuppliersCount} > 0
          THEN (${answerCount}::FLOAT / ${invitedSuppliersCount}) * 100
          ELSE NULL
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Response Rate`,
      description: `Percentage of invited suppliers who submitted answers`
    },

    rejectRate: {
      sql: `
        CASE
          WHEN ${invitedSuppliersCount} > 0
          THEN (${rejectedSuppliersCount}::FLOAT / ${invitedSuppliersCount}) * 100
          ELSE NULL
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Reject Rate`,
      description: `Percentage of invited suppliers who rejected the invitation`
    },

    // Time-based KPIs
    offerPeriodDays: {
      sql: `
        AVG(
          CASE
            WHEN ${CUBE.startedDate} IS NOT NULL
             AND ${CUBE.deadline} IS NOT NULL
            THEN ROUND(EXTRACT(EPOCH FROM (${CUBE.deadline} - ${CUBE.startedDate})) / 86400)
            ELSE NULL
          END
        )::INTEGER
      `,
      type: `number`,
      title: `Offer Period (Days)`,
      description: `Average number of days between start and deadline`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the RFI`
    },
    
    eventType: {
      sql: `'RFI'`,
      type: `string`,
      title: `Event Type`,
      description: `Type of sourcing event (fixed to RFI)`
    },
    
    number: {
      sql: `"number"`,
      type: `string`,
      title: `RFI Number`,
      description: `Human-readable RFI number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `RFI Name`,
      description: `Name assigned to the RFI`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`,
      description: `Brief description of the RFI`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Status`,
      description: `ID of the current status of the RFI`
    },
    
    stateName: {
      sql: `${StateRequestForInformation.name}`,
      type: `string`,
      title: `Status Name`,
      description: `Human-readable status name`
    },
    
    domain: {
      sql: `domain`,
      type: `string`,
      description: `Business domain of the RFI`
    },
    
    // Contact fields
    commercialContact: {
      sql: `(commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName')`,
      type: `string`,
      title: `Commercial Contact`,
      description: `Name of the commercial contact person`
    },
    
    commercialContactEmail: {
      sql: `commercial_contact::jsonb->>'Email'`,
      type: `string`,
      title: `Commercial Contact Email`,
      description: `Email of the commercial contact person`
    },
    
    commercialContactId: {
      sql: `commercial_contact::jsonb->>'Id'`,
      type: `string`,
      title: `Commercial Contact ID`,
      description: `User ID of the commercial contact person`
    },
    
    technicalContact: {
      sql: `(technical_contact::jsonb->>'FirstName') || ' ' || (technical_contact::jsonb->>'LastName')`,
      type: `string`,
      title: `Technical Contact`,
      description: `Name of the technical contact person`
    },
    
    technicalContactEmail: {
      sql: `technical_contact::jsonb->>'Email'`,
      type: `string`,
      title: `Technical Contact Email`,
      description: `Email of the technical contact person`
    },
    
    technicalContactId: {
      sql: `technical_contact::jsonb->>'Id'`,
      type: `string`,
      title: `Technical Contact ID`,
      description: `User ID of the technical contact person`
    },
    
    // Creator fields
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`,
      title: `Created By`,
      description: `Name of the user who created the RFI`
    },
    
    createdByUserId: {
      sql: `created_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Created By User ID`,
      description: `ID of the user who created the RFI`
    },
    
    creatorDepartment: {
      sql: `created_by::jsonb->>'Department'`,
      type: `string`,
      title: `Creator Department`,
      description: `Department of the user who created the RFI`
    },
    
    updatedBy: {
      sql: `(updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who last updated the RFI`
    },
    
    updatedByUserId: {
      sql: `updated_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Updated By User ID`,
      description: `ID of the user who last updated the RFI`
    },
    
    roundNumber: {
      sql: `round_number`,
      type: `number`,
      title: `Number of Rounds`,
      description: `Current round number of the RFI`
    },
    
    documentLanguage: {
      sql: `document_language`,
      type: `string`,
      description: `Language of the RFI document`
    },
    
    createdFrom: {
      sql: `created_from`,
      type: `string`,
      description: `Source from which the RFI was created`
    },
    
    deliveryConditions: {
      sql: `delivery_conditions`,
      type: `string`,
      description: `Delivery conditions specified in the RFI`
    },
    
    paymentTerms: {
      sql: `payment_terms`,
      type: `string`,
      description: `Payment terms specified in the RFI`
    },
    
    // Dates
    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
      description: `Timestamp when the RFI was created`
    },
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      description: `Timestamp when the RFI was last updated`
    },
    
    startedDate: {
      sql: `started_date`,
      type: `time`,
      title: `Started/Published At`,
      description: `Timestamp when the RFI was started or published`
    },
    
    deadline: {
      sql: `deadline`,
      type: `time`,
      title: `Submission Deadline`,
      description: `Timestamp of the submission deadline`
    },
    
    repliesOpenedAt: {
      sql: `replies_opened_at`,
      type: `time`,
      title: `Replies Opened At`,
      description: `Timestamp when the replies were opened`
    },
    
    repliesOpenedBy: {
      sql: `(replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who opened the replies`
    },
    
    repliesOpenedByUserId: {
      sql: `replies_opened_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Replies Opened By User ID`,
      description: `ID of the user who opened the replies`
    },
    
    // Boolean flags
    isInEditMode: {
      sql: `is_in_edit_mode`,
      type: `boolean`,
      description: `Flag indicating if the RFI is currently being edited`
    },
    
    hasDocumentChanged: {
      sql: `has_document_changed`,
      type: `boolean`,
      description: `Flag indicating if the RFI document has changed`
    },
    
    hasDeadlineChanged: {
      sql: `has_deadline_changed`,
      type: `boolean`,
      description: `Flag indicating if the deadline has changed`
    },
    
    hasQuestionnaireQuestionChanged: {
      sql: `has_questionnaire_question_changed`,
      type: `boolean`,
      description: `Flag indicating if questionnaire questions have changed`
    },
    
    lastSubmissionId: {
      sql: `last_submission_id`,
      type: `string`,
      description: `ID of the last submission for this RFI`
    }
  }
});
