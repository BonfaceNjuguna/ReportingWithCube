// Cube.js schema for Orders
// Maps to: buyer_d_fdw_order_service."order"

cube(`Order`, {
  sql: `SELECT * FROM buyer_d_fdw_order_service."order"`,
  
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
      granularity: `day`,
      refreshKey: {
        sql: `SELECT MAX(updated_at) FROM buyer_d_fdw_order_service."order"`
      }
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
      title: `Order Count`,
      description: `Total number of orders`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`,
      title: `Total Order Volume`,
      description: `Sum of all order prices`
    },
    
    avgTotalPrice: {
      sql: `total_price`,
      type: `avg`,
      format: `currency`,
      title: `Average Order Value`,
      description: `Average price per order`
    },
    
    minTotalPrice: {
      sql: `total_price`,
      type: `min`,
      format: `currency`,
      description: `Minimum order price`
    },
    
    maxTotalPrice: {
      sql: `total_price`,
      type: `max`,
      format: `currency`,
      description: `Maximum order price`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the order`
    },
    
    number: {
      sql: `"number"`,
      type: `string`,
      title: `Order Number`,
      description: `Human-readable order number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `Order Name`,
      description: `Name assigned to the order`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`,
      description: `Brief description of the order`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Current State`,
      description: `ID of the current status of the order`
    },
    
    sourceDocumentId: {
      sql: `source_document_id`,
      type: `string`,
      title: `Source Document ID (Quotation)`,
      description: `Reference to the source quotation ID`
    },
    
    orderToSupplierContact: {
      sql: `order_to_supplier_contact::jsonb->>'Name'`,
      type: `string`,
      title: `Supplier Contact`,
      description: `Contact name at the supplier`
    },
    
    orderToSupplierEmail: {
      sql: `order_to_supplier_contact::jsonb->>'EmailAddress'`,
      type: `string`,
      title: `Supplier Email`,
      description: `Contact email at the supplier`
    },
    
    orderToSupplierBusinessPartnerNumber: {
      sql: `order_to_supplier_contact::jsonb->>'BusinessPartnerNumber'`,
      type: `string`,
      title: `Supplier BP Number`,
      description: `Business partner number of the supplier`
    },
    
    documentType: {
      sql: `document_type`,
      type: `string`,
      description: `Type of the order document`
    },
    
    // Organization
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
    
    purchaseOrderTypeDummy: {
      sql: `purchase_order_type_dummy`,
      type: `string`,
      description: `Dummy field for purchase order type`
    },
    
    // Financial
    domain: {
      sql: `domain`,
      type: `string`,
      description: `Business domain of the order`
    },
    
    currency: {
      sql: `currency`,
      type: `string`,
      description: `Currency of the order`
    },
    
    totalPriceValue: {
      sql: `total_price`,
      type: `number`,
      format: `currency`,
      description: `Raw numeric value of the total price`
    },
    
    // Metadata
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`,
      title: `Created By`,
      description: `Name of the user who created the order`
    },
    
    createdByUserId: {
      sql: `created_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Created By User ID`,
      description: `ID of the user who created the order`
    },
    
    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`,
      description: `Timestamp when the order was created`
    },
    
    updatedBy: {
      sql: `(updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who last updated the order`
    },
    
    updatedByUserId: {
      sql: `updated_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Updated By User ID`,
      description: `ID of the user who last updated the order`
    },
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      description: `Timestamp when the order was last updated`
    },
    
    createdFrom: {
      sql: `created_from`,
      type: `string`,
      description: `Source from which the order was created`
    },
    
    documentLanguage: {
      sql: `document_language`,
      type: `string`,
      description: `Language of the order document`
    },
    
    // Boolean flags
    isTreeViewEnabled: {
      sql: `is_tree_view_enabled`,
      type: `boolean`,
      description: `Flag indicating if tree view is enabled`
    }
  }
});
