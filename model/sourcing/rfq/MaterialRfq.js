cube(`MaterialRfq`, {
  sql: `SELECT * FROM buyer_d_fdw_rfq_service.material_rfq`,
  
  preAggregations: {
    main: {
      measures: [
        MaterialRfq.count,
        MaterialRfq.totalPrice,
        MaterialRfq.avgTotalPrice
      ],
      dimensions: [
        MaterialRfq.number,
        MaterialRfq.createdBy,
        MaterialRfq.currentStateId,
        MaterialRfq.purchaseOrganisation
      ],
      timeDimension: MaterialRfq.createdAt,
      granularity: `day`,
      refreshKey: {
        sql: `SELECT MAX(updated_at) FROM buyer_d_fdw_rfq_service.material_rfq`
      }
    },
    byCreator: {
      measures: [MaterialRfq.count, MaterialRfq.avgCycleTime, MaterialRfq.avgOfferPeriod],
      dimensions: [MaterialRfq.createdBy],
      timeDimension: MaterialRfq.createdAt,
      granularity: `month`,
      refreshKey: {
        sql: `SELECT MAX(updated_at) FROM buyer_d_fdw_rfq_service.material_rfq`
      }
    },
    byCreatorMonthlyKpis: {
      measures: [
        MaterialRfq.count,
        MaterialRfq.invitedSuppliersCount,
        MaterialRfq.offeredSuppliersCount
      ],
      dimensions: [
        MaterialRfq.purchaseOrganisation,
        MaterialRfq.stateName
      ],
      timeDimension: MaterialRfq.createdAt,
      granularity: `month`,
      refreshKey: {
        sql: `SELECT MAX(updated_at) FROM buyer_d_fdw_rfq_service.material_rfq`
      }
    }
  },

  joins: {
    MaterialRfqDocumentItem: {
      sql: `${CUBE}.id = ${MaterialRfqDocumentItem}.document_header_id`,
      relationship: `hasMany`
    },
    RequestForToSupplierMaterialRfq: {
      sql: `${CUBE}.id = ${RequestForToSupplierMaterialRfq}.parent_id`,
      relationship: `hasMany`
    },
    Quotation: {
      sql: `${CUBE}.id = ${Quotation}.request_for_id`,
      relationship: `hasMany`
    },
    StateMaterialRfq: {
      sql: `${CUBE}.current_state_id = ${StateMaterialRfq}.id`,
      relationship: `belongsTo`
    },
    StateRequestForToSupplierMaterialRfq: {
      relationship: `belongsTo`,
      sql: `${RequestForToSupplierMaterialRfq}.current_state_id = ${StateRequestForToSupplierMaterialRfq}.id`
    },
    OrderAward: {
      relationship: `belongsTo`,
      sql: `${CUBE}.id = ${OrderAward.rfqId}`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [number, name, createdAt, createdBy],
      description: `Total number of RFQs`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`,
      description: `Sum of all RFQ total prices`
    },
    
    avgTotalPrice: {
      sql: `total_price`,
      type: `avg`,
      format: `currency`,
      description: `Average price of RFQs`
    },
    
    // Offer Period (days between created_at and deadline)
    avgOfferPeriod: {
      sql: `EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.created_at))/86400`,
      type: `avg`,
      format: `number`,
      title: `Average Offer Period (Days)`,
      description: `Average time given to suppliers to submit offers`
    },
    
    // Cycle Time (days between started_date and first order created)
    avgCycleTime: {
      sql: `EXTRACT(EPOCH FROM (${CUBE}.updated_at - ${CUBE}.started_date))/86400`,
      type: `avg`,
      format: `number`,
      title: `Average Cycle Time (Days)`,
      description: `Average time from event start to completion (first order award)`
    },

    // Supplier KPIs
    invitedSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${RequestForToSupplierMaterialRfq}.is_active = true` }],
      title: `Invited Suppliers`,
      description: `Total number of unique suppliers invited to RFQs`
    },

    viewedSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierMaterialRfq}.name = 'Seen'` }],
      title: `Viewed Suppliers`,
      description: `Total number of unique suppliers who viewed the RFQs`
    },

    offeredSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierMaterialRfq}.name = 'SupplierReplySubmitted'` }],
      title: `Offered Suppliers`,
      description: `Total number of unique suppliers who submitted offers`
    },

    rejectedSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierMaterialRfq}.name = 'Rejected'` }],
      title: `Rejected Suppliers`,
      description: `Total number of unique suppliers who rejected the RFQ invitation`
    },

    // Quotation KPIs
    bestQuotationTotal: {
      sql: `${Quotation.totalPrice}`,
      type: `min`,
      format: `currency`,
      title: `Best Quotation (Lowest)`,
      description: `Lowest price among valid and opened quotations in the current round`,
      filters: [
        { sql: `${Quotation}.is_opened = true` },
        { sql: `${Quotation}.round_number = ${CUBE.roundNumber}` },
        { sql: `${Quotation}.version_number = 0` },
        { sql: `NOT EXISTS (
          SELECT 1 
          FROM buyer_d_fdw_rfq_service.quotation_document_item qdi
          WHERE qdi.root_id = ${Quotation}.id 
            AND qdi.unit_price <= 0
            AND qdi.item_type <> 3
        )` }
      ]
    },

    quotationTotalValid: {
      sql: `(
        SELECT SUM(q.total_price)
        FROM buyer_d_fdw_rfq_service.quotation q
        JOIN buyer_d_fdw_rfq_service.state_quotation sq ON q.current_state_id = sq.id
        WHERE q.request_for_id = ${CUBE}.id
          AND q.is_opened = true
          AND q.round_number = ${CUBE.roundNumber}
          AND q.version_number = 0
          AND sq.name = 'Submitted'
      )`,
      type: `number`,
      format: `currency`,
      title: `Valid Quotation Total`,
      description: `Total price of all submitted and valid quotations`
    },

    quotationCountValid: {
      sql: `(
        SELECT COUNT(*)
        FROM buyer_d_fdw_rfq_service.quotation q
        JOIN buyer_d_fdw_rfq_service.state_quotation sq ON q.current_state_id = sq.id
        WHERE q.request_for_id = ${CUBE}.id
          AND q.is_opened = true
          AND q.round_number = ${CUBE.roundNumber}
          AND q.version_number = 0
          AND sq.name = 'Submitted'
      )`,
      type: `number`,
      title: `Valid Quotations Count`,
      description: `Number of submitted and valid quotations`
    },

    quotationTotalAvg: {
      sql: `
        CASE
          WHEN ${quotationCountValid} > 0
          THEN ${quotationTotalValid}::FLOAT / ${quotationCountValid}
          ELSE NULL
        END
      `,
      type: `number`,
      format: `currency`,
      title: `Average Quotation Total`,
      description: `Average price of valid quotations`
    },

    // Rate KPIs
    quotationRate: {
      sql: `
        CASE
          WHEN ${invitedSuppliersCount} > 0
          THEN (${quotationCountValid}::FLOAT / ${invitedSuppliersCount}) * 100
          ELSE NULL
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Quotation Rate`,
      description: `Percentage of invited suppliers who submitted a valid quotation`
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
      description: `Average number of days suppliers have to submit their offers`
    },

    cycleTimeDays: {
      sql: `AVG(ROUND(EXTRACT(EPOCH FROM (${OrderAward.awardedAtTime} - ${CUBE}.started_date)) / 86400))::INTEGER`,
      type: `number`,
      title: `Cycle Time (Days)`,
      description: `Average number of days from start to first order award`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the RFQ`
    },
    
    eventType: {
      sql: `'RFQ'`,
      type: `string`,
      title: `Event Type`,
      description: `Type of sourcing event (fixed to RFQ)`
    },
    
    number: {
      sql: `"number"`,
      type: `string`,
      title: `RFQ Number`,
      description: `Human-readable RFQ number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `RFQ Name`,
      description: `Name assigned to the RFQ`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`,
      description: `Brief description of the RFQ`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Status`,
      description: `ID of the current status of the RFQ`
    },
    
    stateName: {
      sql: `${StateMaterialRfq.name}`,
      type: `string`,
      title: `Status Name`,
      description: `Human-readable status name`
    },
    
    // Organization fields
    purchaseOrganisation: {
      sql: `purchase_organisation::jsonb->>'Code'`,
      type: `string`,
      title: `Purchase Organisation`,
      description: `Code of the purchasing organization`
    },
    
    purchaseOrganisationName: {
      sql: `purchase_organisation::jsonb->>'Name'`,
      type: `string`,
      title: `Purchase Organisation Name`,
      description: `Name of the purchasing organization`
    },
    
    companyCode: {
      sql: `company_code::jsonb->>'Code'`,
      type: `string`,
      title: `Company Code`,
      description: `Code of the company`
    },
    
    companyCodeName: {
      sql: `company_code::jsonb->>'Name'`,
      type: `string`,
      title: `Company Name`,
      description: `Name of the company`
    },
    
    purchaseGroup: {
      sql: `purchase_group::jsonb->>'Code'`,
      type: `string`,
      title: `Purchase Group`,
      description: `Code of the purchasing group`
    },
    
    purchaseGroupName: {
      sql: `purchase_group::jsonb->>'Name'`,
      type: `string`,
      title: `Purchase Group Name`,
      description: `Name of the purchasing group`
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
      sql: `technical_contact`,
      type: `string`,
      title: `Technical Contact`,
      description: `Name or ID of the technical contact person`
    },
    
    // Creator fields
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`,
      title: `Created By`,
      description: `Name of the user who created the RFQ`
    },
    
    createdByUserId: {
      sql: `created_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Created By User ID`,
      description: `ID of the user who created the RFQ`
    },
    
    creatorDepartment: {
      sql: `created_by::jsonb->>'Department'`,
      type: `string`,
      title: `Creator Department`,
      description: `Department of the user who created the RFQ`
    },
    
    updatedBy: {
      sql: `(updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who last updated the RFQ`
    },
    
    updatedByUserId: {
      sql: `updated_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Updated By User ID`,
      description: `ID of the user who last updated the RFQ`
    },
    
    // Other attributes
    domain: {
      sql: `domain`,
      type: `string`,
      description: `Business domain of the RFQ`
    },
    
    currency: {
      sql: `currency`,
      type: `string`,
      description: `Currency used in the RFQ`
    },
    
    roundNumber: {
      sql: `round_number`,
      type: `number`,
      title: `Number of Rounds`,
      description: `Current round number of the RFQ`
    },
    
    documentLanguage: {
      sql: `document_language`,
      type: `string`,
      description: `Language of the RFQ document`
    },
    
    externalIdentifier: {
      sql: `external_identifier`,
      type: `string`,
      description: `External ID for the RFQ`
    },
    
    // Dates
    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
      description: `Timestamp when the RFQ was created`
    },
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      description: `Timestamp when the RFQ was last updated`
    },
    
    startedDate: {
      sql: `started_date`,
      type: `time`,
      title: `Started/Published At`,
      description: `Timestamp when the RFQ was started or published`
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
    
    awardedAt: {
      sql: `${OrderAward.awardedAtTime}`,
      type: `time`,
      title: `Award Decision Date`,
      description: `Date when the first order award was made`
    },
    
    // Boolean flags
    isInEditMode: {
      sql: `is_in_edit_mode`,
      type: `boolean`,
      description: `Flag indicating if the RFQ is in edit mode`
    },
    
    hasDocumentChanged: {
      sql: `has_document_changed`,
      type: `boolean`,
      description: `Flag indicating if the RFQ document has changed`
    },
    
    hasDeadlineChanged: {
      sql: `has_deadline_changed`,
      type: `boolean`,
      description: `Flag indicating if the deadline has changed`
    },
    
    isGaebConform: {
      sql: `is_gaeb_conform`,
      type: `boolean`,
      description: `Flag indicating if the RFQ is GAEB conform`
    },
    
    isTreeViewEnabled: {
      sql: `is_tree_view_enabled`,
      type: `boolean`,
      description: `Flag indicating if tree view is enabled`
    }
  }
});
