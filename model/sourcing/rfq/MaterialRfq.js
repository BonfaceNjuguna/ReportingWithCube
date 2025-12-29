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
        every: `1 hour`
      }
    },
    byCreator: {
      measures: [MaterialRfq.count, MaterialRfq.avgCycleTime, MaterialRfq.avgOfferPeriod],
      dimensions: [MaterialRfq.createdBy],
      timeDimension: MaterialRfq.createdAt,
      granularity: `month`
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
        every: `1 hour`
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
      drillMembers: [number, name, createdAt, createdBy]
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`
    },
    
    avgTotalPrice: {
      sql: `total_price`,
      type: `avg`,
      format: `currency`
    },
    
    // Offer Period (days between created_at and deadline)
    avgOfferPeriod: {
      sql: `EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.created_at))/86400`,
      type: `avg`,
      format: `number`,
      title: `Average Offer Period (Days)`
    },
    
    // Cycle Time (days between started_date and first order created)
    avgCycleTime: {
      sql: `EXTRACT(EPOCH FROM (${CUBE}.updated_at - ${CUBE}.started_date))/86400`,
      type: `avg`,
      format: `number`,
      title: `Average Cycle Time (Days)`,
      description: `Time from event start to completion`
    },

    // Supplier KPIs
    invitedSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${RequestForToSupplierMaterialRfq}.is_active = true` }],
      title: `Invited Suppliers`
    },

    viewedSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierMaterialRfq}.name = 'Seen'` }],
      title: `Viewed Suppliers`
    },

    offeredSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierMaterialRfq}.name = 'SupplierReplySubmitted'` }],
      title: `Offered Suppliers`
    },

    rejectedSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.id}`,
      type: `countDistinct`,
      filters: [{ sql: `${StateRequestForToSupplierMaterialRfq}.name = 'Rejected'` }],
      title: `Rejected Suppliers`
    },

    // Quotation KPIs
    bestQuotationTotal: {
      sql: `${Quotation.totalPrice}`,
      type: `min`,
      format: `currency`,
      title: `Best Quotation (Lowest)`,
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

    quotationTotal: {
      sql: `${Quotation.totalPrice}`,
      type: `sum`,
      format: `currency`,
      title: `Quotation Total`,
      filters: [
        { sql: `${Quotation}.is_opened = true` },
        { sql: `${Quotation}.round_number = ${CUBE.roundNumber}` },
        { sql: `${Quotation}.version_number = 0` }
      ]
    },

    quotationCountValid: {
      sql: `${Quotation.id}`,
      type: `countDistinct`,
      title: `Valid Quotations Count`,
      filters: [
        { sql: `${Quotation}.is_opened = true` },
        { sql: `${Quotation}.round_number = ${CUBE.roundNumber}` },
        { sql: `${Quotation}.version_number = 0` }
      ]
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
    },

    cycleTimeDays: {
      sql: `AVG(ROUND(EXTRACT(EPOCH FROM (${OrderAward.awardedAtTime} - ${CUBE}.started_date)) / 86400))::INTEGER`,
      type: `number`,
      title: `Cycle Time (Days)`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true
    },
    
    eventType: {
      sql: `'RFQ'`,
      type: `string`,
      title: `Event Type`
    },
    
    number: {
      sql: `"number"`,
      type: `string`,
      title: `RFQ Number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `RFQ Name`
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
    
    stateName: {
      sql: `${StateMaterialRfq.name}`,
      type: `string`,
      title: `Status Name`
    },
    
    // Organization fields
    purchaseOrganisation: {
      sql: `purchase_organisation::jsonb->>'Code'`,
      type: `string`,
      title: `Purchase Organisation`
    },
    
    purchaseOrganisationName: {
      sql: `purchase_organisation::jsonb->>'Name'`,
      type: `string`,
      title: `Purchase Organisation Name`
    },
    
    companyCode: {
      sql: `company_code::jsonb->>'Code'`,
      type: `string`,
      title: `Company Code`
    },
    
    companyCodeName: {
      sql: `company_code::jsonb->>'Name'`,
      type: `string`,
      title: `Company Name`
    },
    
    purchaseGroup: {
      sql: `purchase_group::jsonb->>'Code'`,
      type: `string`,
      title: `Purchase Group`
    },
    
    purchaseGroupName: {
      sql: `purchase_group::jsonb->>'Name'`,
      type: `string`,
      title: `Purchase Group Name`
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
      sql: `technical_contact`,
      type: `string`,
      title: `Technical Contact`
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
    
    creatorDepartment: {
      sql: `created_by::jsonb->>'Department'`,
      type: `string`,
      title: `Creator Department`
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
    
    // Other attributes
    domain: {
      sql: `domain`,
      type: `string`
    },
    
    currency: {
      sql: `currency`,
      type: `string`
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
    
    externalIdentifier: {
      sql: `external_identifier`,
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
    
    awardedAt: {
      sql: `${OrderAward.awardedAtTime}`,
      type: `time`,
      title: `Award Decision Date`
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
    
    isGaebConform: {
      sql: `is_gaeb_conform`,
      type: `boolean`
    },
    
    isTreeViewEnabled: {
      sql: `is_tree_view_enabled`,
      type: `boolean`
    }
  }
});
