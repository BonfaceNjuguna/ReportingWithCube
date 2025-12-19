// Cube.js schema for Material RFQ (main events table)
// Maps to: buyer_d_fdw_rfq_service.material_rfq

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
      sql: `${CUBE}.id = ${Quotation}.request_for_id AND ${Quotation}.domain = 'material_rfq'`,
      relationship: `hasMany`
    },
    StateMaterialRfq: {
      sql: `${CUBE}.current_state_id = ${StateMaterialRfq}.id`,
      relationship: `belongsTo`
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
    
    // KPI: Offer Period (days between created_at and deadline)
    avgOfferPeriod: {
      sql: `EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.created_at))/86400`,
      type: `avg`,
      format: `number`,
      title: `Average Offer Period (Days)`
    },
    
    // KPI: Cycle Time (days between started_date and first order created)
    avgCycleTime: {
      sql: `EXTRACT(EPOCH FROM (${CUBE}.updated_at - ${CUBE}.started_date))/86400`,
      type: `avg`,
      format: `number`,
      title: `Average Cycle Time (Days)`,
      description: `Time from event start to completion`
    },
    
    // Count of invited suppliers (via join)
    invitedSuppliersCount: {
      sql: `${RequestForToSupplierMaterialRfq.count}`,
      type: `number`
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
