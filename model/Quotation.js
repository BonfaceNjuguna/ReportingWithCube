// Cube.js schema for Quotations
// Maps to: public.quotation

cube(`Quotation`, {
  sql: `SELECT * FROM public.quotation`,
  
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
      title: `Quotation Count`
    },
    
    // Count only submitted quotations (valid)
    submittedCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.submitted_at IS NOT NULL` }],
      title: `Submitted Quotations Count`
    },
    
    // Count only original versions (V1.0, V2.0, not clones like V1.1)
    originalVersionsCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.original_quotation_id IS NULL` }],
      title: `Original Quotations Count`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`
    },
    
    avgTotalPrice: {
      sql: `total_price`,
      type: `avg`,
      format: `currency`,
      title: `Average Quotation Total`
    },
    
    minTotalPrice: {
      sql: `total_price`,
      type: `min`,
      format: `currency`,
      title: `Best (Lowest) Quotation Total`
    },
    
    maxTotalPrice: {
      sql: `total_price`,
      type: `max`,
      format: `currency`
    },
    
    activeTotalPrice: {
      sql: `active_total_price`,
      type: `sum`,
      format: `currency`
    },
    
    avgActiveTotalPrice: {
      sql: `active_total_price`,
      type: `avg`,
      format: `currency`
    },
    
    // Count of opened quotations
    openedCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.is_opened = true` }],
      title: `Opened Quotations Count`
    },
    
    // CO2 metrics
    totalCo2Equivalent: {
      sql: `co2equivalent_total`,
      type: `sum`,
      format: `number`
    },
    
    avgCo2Equivalent: {
      sql: `co2equivalent_total`,
      type: `avg`,
      format: `number`
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
      title: `Quotation Number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `Quotation Name`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`
    },
    
    requestForId: {
      sql: `request_for_id`,
      type: `string`,
      title: `RFQ ID`
    },
    
    requestForToSupplierId: {
      sql: `request_for_to_supplier_id`,
      type: `string`,
      title: `Supplier Invitation ID`
    },
    
    supplierReplyId: {
      sql: `supplier_reply_id`,
      type: `string`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Current State`
    },
    
    // Version control
    sequenceNumber: {
      sql: `sequence_number`,
      type: `number`
    },
    
    roundNumber: {
      sql: `round_number`,
      type: `number`,
      title: `Round Number`
    },
    
    versionNumber: {
      sql: `version_number`,
      type: `string`,
      title: `Version Number`
    },
    
    originalQuotationId: {
      sql: `original_quotation_id`,
      type: `string`,
      title: `Original Quotation ID`
    },
    
    // Resulting documents
    orderNumbers: {
      sql: `order_numbers`,
      type: `string`,
      title: `Order Numbers`
    },
    
    contractNumbers: {
      sql: `contract_numbers`,
      type: `string`,
      title: `Contract Numbers`
    },
    
    // Financial
    domain: {
      sql: `domain`,
      type: `string`
    },
    
    currency: {
      sql: `currency`,
      type: `string`
    },
    
    totalPriceValue: {
      sql: `total_price`,
      type: `number`,
      format: `currency`
    },
    
    activeTotalPriceValue: {
      sql: `active_total_price`,
      type: `number`,
      format: `currency`
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
      title: `Submitted At`
    },

    validUntilDate: {
      sql: `valid_until_date`,
      type: `time`,
      title: `Valid Until`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`
    },

    updatedAt: {
      sql: `updated_at`,
      type: `time`
    },
    
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`
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
    documentLanguage: {
      sql: `document_language`,
      type: `string`
    },
    
    createdFrom: {
      sql: `created_from`,
      type: `string`
    },
    
    co2equivalentTotal: {
      sql: `co2equivalent_total`,
      type: `number`,
      title: `CO2 Equivalent Total`
    },
    
    // Boolean flags
    isOpened: {
      sql: `is_opened`,
      type: `boolean`,
      title: `Is Opened`
    },
    
    isTreeViewEnabled: {
      sql: `is_tree_view_enabled`,
      type: `boolean`
    }
  }
});
