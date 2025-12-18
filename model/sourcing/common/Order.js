// Cube.js schema for Orders
// Maps to: public."order"

cube(`Order`, {
  sql: `SELECT * FROM public."order"`,
  
  preAggregations: {
    main: {
      measures: [
        Order.count,
        Order.totalPrice,
        Order.avgTotalPrice
      ],
      dimensions: [
        Order.purchaseOrganisation,
        Order.companyCode,
        Order.currentStateId
      ],
      timeDimension: Order.createdAt,
      granularity: `day`
    }
  },

  joins: {
    Quotation: {
      sql: `${CUBE}.source_document_id = ${Quotation}.id`,
      relationship: `belongsTo`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [number, name, createdAt],
      title: `Order Count`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`,
      title: `Total Order Volume`
    },
    
    avgTotalPrice: {
      sql: `total_price`,
      type: `avg`,
      format: `currency`,
      title: `Average Order Value`
    },
    
    minTotalPrice: {
      sql: `total_price`,
      type: `min`,
      format: `currency`
    },
    
    maxTotalPrice: {
      sql: `total_price`,
      type: `max`,
      format: `currency`
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
      title: `Order Number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `Order Name`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Current State`
    },
    
    sourceDocumentId: {
      sql: `source_document_id`,
      type: `string`,
      title: `Source Document ID (Quotation)`
    },
    
    orderToSupplierContact: {
      sql: `order_to_supplier_contact::jsonb->>'Name'`,
      type: `string`,
      title: `Supplier Contact`
    },
    
    orderToSupplierEmail: {
      sql: `order_to_supplier_contact::jsonb->>'EmailAddress'`,
      type: `string`,
      title: `Supplier Email`
    },
    
    orderToSupplierBusinessPartnerNumber: {
      sql: `order_to_supplier_contact::jsonb->>'BusinessPartnerNumber'`,
      type: `string`,
      title: `Supplier BP Number`
    },
    
    documentType: {
      sql: `document_type`,
      type: `string`
    },
    
    // Organization
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
    
    purchaseOrderTypeDummy: {
      sql: `purchase_order_type_dummy`,
      type: `string`
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
    
    // Metadata
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
    
    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`
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
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`
    },
    
    createdFrom: {
      sql: `created_from`,
      type: `string`
    },
    
    documentLanguage: {
      sql: `document_language`,
      type: `string`
    },
    
    // Boolean flags
    isTreeViewEnabled: {
      sql: `is_tree_view_enabled`,
      type: `boolean`
    }
  }
});
