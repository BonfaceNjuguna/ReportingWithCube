// Cube.js schema for Quotations
// Maps to: buyer_d_fdw_rfq_service.quotation

cube(`Quotation`, {
  sql: `SELECT * FROM buyer_d_fdw_rfq_service.quotation`,
  
  preAggregations: {
    main: {
      measures: [
        Quotation.count,
        Quotation.totalPrice,
        Quotation.avgTotalPrice,
        Quotation.minTotalPrice
      ],
      dimensions: [
        Quotation.requestForId,
        Quotation.currentStateId,
        Quotation.roundNumber
      ],
      timeDimension: Quotation.submittedAt,
      granularity: `day`
    }
  },

  joins: {
    MaterialRfq: {
      sql: `${CUBE}.request_for_id = ${MaterialRfq}.id`,
      relationship: `belongsTo`
    },
    RequestForToSupplierMaterialRfq: {
      sql: `${CUBE}.request_for_to_supplier_id = ${RequestForToSupplierMaterialRfq}.id`,
      relationship: `belongsTo`
    },
    Order: {
      sql: `${CUBE}.id = ANY(string_to_array(${Order}.source_document_id, ','))`,
      relationship: `hasMany`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [number, name, submittedAt],
      title: `Quotation Count`,
      description: `Total number of quotations`
    },
    
    // Count only submitted quotations (valid)
    submittedCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.submitted_at IS NOT NULL` }],
      title: `Submitted Quotations Count`,
      description: `Total number of submitted quotations`
    },
    
    // Count only original versions (V1.0, V2.0, not clones like V1.1)
    originalVersionsCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.original_quotation_id IS NULL` }],
      title: `Original Quotations Count`,
      description: `Total number of original quotations (V1.0, V2.0, etc.)`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`,
      description: `Sum of all quotation prices`
    },
    
    avgTotalPrice: {
      sql: `total_price`,
      type: `avg`,
      format: `currency`,
      title: `Average Quotation Total`,
      description: `Average price of quotations`
    },
    
    minTotalPrice: {
      sql: `total_price`,
      type: `min`,
      format: `currency`,
      title: `Best (Lowest) Quotation Total`,
      description: `Minimum price among quotations`
    },
    
    maxTotalPrice: {
      sql: `total_price`,
      type: `max`,
      format: `currency`,
      description: `Maximum price among quotations`
    },
    
    activeTotalPrice: {
      sql: `active_total_price`,
      type: `sum`,
      format: `currency`,
      description: `Sum of active total prices`
    },
    
    avgActiveTotalPrice: {
      sql: `active_total_price`,
      type: `avg`,
      format: `currency`,
      description: `Average of active total prices`
    },
    
    // Count of opened quotations
    openedCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.is_opened = true` }],
      title: `Opened Quotations Count`,
      description: `Total number of opened quotations`
    },
    
    // CO2 metrics
    totalCo2Equivalent: {
      sql: `co2equivalent_total`,
      type: `sum`,
      format: `number`,
      description: `Total CO2 equivalent of quotations`
    },
    
    avgCo2Equivalent: {
      sql: `co2equivalent_total`,
      type: `avg`,
      format: `number`,
      description: `Average CO2 equivalent per quotation`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the quotation`
    },
    
    number: {
      sql: `"number"`,
      type: `string`,
      title: `Quotation Number`,
      description: `Human-readable quotation number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `Quotation Name`,
      description: `Name assigned to the quotation`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`,
      description: `Brief description of the quotation`
    },
    
    requestForId: {
      sql: `request_for_id`,
      type: `string`,
      title: `RFQ ID`,
      description: `Reference to the RFQ ID`
    },
    
    requestForToSupplierId: {
      sql: `request_for_to_supplier_id`,
      type: `string`,
      title: `Supplier Invitation ID`,
      description: `Reference to the supplier invitation`
    },
    
    supplierReplyId: {
      sql: `supplier_reply_id`,
      type: `string`,
      description: `ID of the supplier reply`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Current State`,
      description: `ID of the current status of the quotation`
    },
    
    // Version control
    sequenceNumber: {
      sql: `sequence_number`,
      type: `number`,
      description: `Sequence number of the quotation version`
    },
    
    roundNumber: {
      sql: `round_number`,
      type: `number`,
      title: `Round Number`,
      description: `Number of the RFQ round`
    },
    
    versionNumber: {
      sql: `version_number`,
      type: `string`,
      title: `Version Number`,
      description: `Version of the quotation`
    },
    
    originalQuotationId: {
      sql: `original_quotation_id`,
      type: `string`,
      title: `Original Quotation ID`,
      description: `Reference to the original quotation if this is a clone`
    },
    
    // Resulting documents
    orderNumbers: {
      sql: `order_numbers`,
      type: `string`,
      title: `Order Numbers`,
      description: `Comma-separated list of resulting order numbers`
    },
    
    contractNumbers: {
      sql: `contract_numbers`,
      type: `string`,
      title: `Contract Numbers`,
      description: `Comma-separated list of resulting contract numbers`
    },
    
    // Financial
    domain: {
      sql: `domain`,
      type: `string`,
      description: `Business domain of the quotation`
    },
    
    currency: {
      sql: `currency`,
      type: `string`,
      description: `Currency of the quotation`
    },
    
    totalPriceValue: {
      sql: `total_price`,
      type: `number`,
      format: `currency`,
      description: `Raw numeric value of the total price`
    },
    
    activeTotalPriceValue: {
      sql: `active_total_price`,
      type: `number`,
      format: `currency`,
      description: `Raw numeric value of the active total price`
    },
    
    // Dates
    submittedAt: {
      sql: `
        CASE
          WHEN ${CUBE}.submitted_at IS NULL THEN NULL
          WHEN btrim(${CUBE}.submitted_at::text) = '' THEN NULL
          WHEN lower(btrim(${CUBE}.submitted_at::text)) IN ('invalid date', 'invalid') THEN NULL
          WHEN btrim(${CUBE}.submitted_at::text) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN ${CUBE}.submitted_at::timestamp
          ELSE NULL
        END
      `,
      type: `time`,
      title: `Submitted At`,
      description: `Timestamp when the quotation was submitted`
    },

    validUntilDate: {
      sql: `valid_until_date`,
      type: `time`,
      title: `Valid Until`,
      description: `Date until which the quotation is valid`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      description: `Timestamp when the quotation was created`
    },

    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      description: `Timestamp when the quotation was last updated`
    },
    
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who created the quotation`
    },
    
    createdByUserId: {
      sql: `created_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Created By User ID`,
      description: `ID of the user who created the quotation`
    },
    
    updatedBy: {
      sql: `(updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who last updated the quotation`
    },
    
    updatedByUserId: {
      sql: `updated_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Updated By User ID`,
      description: `ID of the user who last updated the quotation`
    },
    
    // Other attributes
    documentLanguage: {
      sql: `document_language`,
      type: `string`,
      description: `Language of the quotation document`
    },
    
    createdFrom: {
      sql: `created_from`,
      type: `string`,
      description: `Source from which the quotation was created`
    },
    
    co2equivalentTotal: {
      sql: `co2equivalent_total`,
      type: `number`,
      title: `CO2 Equivalent Total`,
      description: `Total CO2 emissions estimated in the quotation`
    },
    
    // Boolean flags
    isOpened: {
      sql: `is_opened`,
      type: `boolean`,
      title: `Is Opened`,
      description: `Flag indicating if the quotation has been opened`
    },
    
    isTreeViewEnabled: {
      sql: `is_tree_view_enabled`,
      type: `boolean`,
      description: `Flag indicating if tree view is enabled`
    }
  }
});
