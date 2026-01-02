// Cube.js schema for Material RFQ Document Items
// Maps to: buyer_d_fdw_rfq_service.material_rfq_document_item

cube(`MaterialRfqDocumentItem`, {
  sql: `SELECT * FROM buyer_d_fdw_rfq_service.material_rfq_document_item`,
  
  preAggregations: {
    byMaterial: {
      measures: [
        MaterialRfqDocumentItem.count,
        MaterialRfqDocumentItem.totalQuantity,
        MaterialRfqDocumentItem.totalPrice,
        MaterialRfqDocumentItem.avgUnitPrice
      ],
      dimensions: [
        MaterialRfqDocumentItem.materialNumber,
        MaterialRfqDocumentItem.materialGroup
      ],
      timeDimension: MaterialRfqDocumentItem.createdAt,
      granularity: `month`
    }
  },

  joins: {
    MaterialRfq: {
      sql: `${CUBE}.document_header_id = ${MaterialRfq}.id`,
      relationship: `belongsTo`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [name, materialNumber, documentHeaderId],
      description: `Total number of RFQ document items`
    },
    
    totalQuantity: {
      sql: `quantity`,
      type: `sum`,
      format: `number`,
      description: `Sum of all item quantities`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`,
      description: `Sum of all item total prices`
    },
    
    avgUnitPrice: {
      sql: `unit_price`,
      type: `avg`,
      format: `currency`,
      description: `Average unit price of items`
    },
    
    minUnitPrice: {
      sql: `unit_price`,
      type: `min`,
      format: `currency`,
      title: `Lowest Unit Price`,
      description: `Minimum unit price among items`
    },
    
    maxUnitPrice: {
      sql: `unit_price`,
      type: `max`,
      format: `currency`,
      description: `Maximum unit price among items`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the document item`
    },
    
    documentHeaderId: {
      sql: `document_header_id`,
      type: `string`,
      description: `Reference to the parent RFQ header ID`
    },
    
    lineItemId: {
      sql: `line_item_id`,
      type: `string`,
      description: `External line item ID`
    },
    
    rootId: {
      sql: `root_id`,
      type: `string`,
      description: `ID of the root item (for hierarchical structures)`
    },
    
    // Item identification
    name: {
      sql: `name`,
      type: `string`,
      title: `Item Name`,
      description: `Short name or title of the item`
    },
    
    longDescription: {
      sql: `long_description`,
      type: `string`,
      description: `Detailed description of the item`
    },
    
    documentTitleId: {
      sql: `document_title_id`,
      type: `string`,
      description: `Reference to the document title ID`
    },
    
    hierarchyNumber: {
      sql: `hierarchy_number`,
      type: `string`,
      description: `Hierarchical position number of the item`
    },
    
    // Material fields
    materialNumber: {
      sql: `material_number`,
      type: `string`,
      title: `Material Number`,
      description: `Internal material number or SKU`
    },
    
    materialGroup: {
      sql: `material_group::jsonb->>'Code'`,
      type: `string`,
      title: `Material Group`,
      description: `Code of the material group`
    },
    
    materialGroupName: {
      sql: `material_group::jsonb->>'Name'`,
      type: `string`,
      title: `Material Group Name`,
      description: `Name of the material group`
    },
    
    productType: {
      sql: `product_type`,
      type: `string`,
      description: `Type classification of the product`
    },
    
    // Source document
    sourceDocumentNumber: {
      sql: `source_document_number`,
      type: `string`,
      description: `Number of the source document`
    },
    
    sourceDocumentItemNumber: {
      sql: `source_document_item_number`,
      type: `string`,
      description: `Item number in the source document`
    },
    
    // Purchasing data
    plant: {
      sql: `plant::jsonb->>'Code'`,
      type: `string`,
      description: `Code of the plant`
    },
    
    plantName: {
      sql: `plant::jsonb->>'Name'`,
      type: `string`,
      title: `Plant Name`,
      description: `Name of the plant`
    },
    
    purchaseGroup: {
      sql: `purchase_group::jsonb->>'Code'`,
      type: `string`,
      description: `Code of the purchasing group`
    },
    
    purchaseGroupName: {
      sql: `purchase_group::jsonb->>'Name'`,
      type: `string`,
      title: `Purchase Group Name`,
      description: `Name of the purchasing group`
    },
    
    purchasingDocument: {
      sql: `purchasing_document`,
      type: `string`,
      description: `Reference to a purchasing document`
    },
    
    // Quantity and pricing
    quantity: {
      sql: `quantity`,
      type: `number`,
      title: `Quantity`,
      description: `Required quantity of the item`
    },
    
    priceQuantity: {
      sql: `price_quantity`,
      type: `number`,
      description: `Quantity for which the unit price applies`
    },
    
    unitPrice: {
      sql: `unit_price`,
      type: `number`,
      format: `currency`,
      description: `Price per unit of the item`
    },
    
    totalPriceValue: {
      sql: `total_price`,
      type: `number`,
      format: `currency`,
      description: `Total price for the item quantity`
    },
    
    // Units
    baseUnit: {
      sql: `base_unit`,
      type: `string`,
      title: `Base Unit`,
      description: `Base unit of measure for the item`
    },
    
    priceUnit: {
      sql: `price_unit`,
      type: `string`,
      description: `Unit of measure for the price`
    },
    
    currency: {
      sql: `currency`,
      type: `string`,
      description: `Currency of the item price`
    },
    
    // Delivery
    deliveryDateCategory: {
      sql: `delivery_date_category`,
      type: `string`,
      description: `Category of the delivery date (e.g. fixed, week)`
    },
    
    deliveryDate: {
      sql: `delivery_date`,
      type: `time`,
      title: `Delivery Date`,
      description: `Requested delivery date`
    },
    
    deliveryAddress: {
      sql: `delivery_address::jsonb->>'FullName'`,
      type: `string`,
      description: `Full name of the delivery contact or company`
    },
    
    deliveryAddressCity: {
      sql: `delivery_address::jsonb->'Address'->>'City'`,
      type: `string`,
      title: `Delivery City`,
      description: `City for delivery`
    },
    
    deliveryAddressStreet: {
      sql: `delivery_address::jsonb->'Address'->>'Street'`,
      type: `string`,
      title: `Delivery Street`,
      description: `Street for delivery`
    },
    
    deliveryAddressPostalCode: {
      sql: `delivery_address::jsonb->'Address'->>'PostalCode'`,
      type: `string`,
      title: `Delivery Postal Code`,
      description: `Postal code for delivery`
    },
    
    // Item classification
    itemCategory: {
      sql: `item_category`,
      type: `string`,
      description: `Category classification of the item`
    },
    
    itemSource: {
      sql: `item_source`,
      type: `string`,
      description: `Source of the item (e.g. manual, ERP)`
    },
    
    itemType: {
      sql: `item_type`,
      type: `string`,
      description: `Type of the item (e.g. material, service)`
    },
    
    parentType: {
      sql: `parent_type`,
      type: `string`,
      description: `Type of the parent item`
    },
    
    depth: {
      sql: `depth`,
      type: `number`,
      description: `Nesting depth of the item in a hierarchy`
    },
    
    sequenceNumber: {
      sql: `sequence_number`,
      type: `number`,
      description: `Ordering sequence number`
    },
    
    // Allocation
    allocationGroupNumber: {
      sql: `allocation_group_number`,
      type: `string`,
      description: `ID of the allocation group`
    },
    
    allocationSerialNumber: {
      sql: `allocation_serial_number`,
      type: `string`,
      description: `Serial number for allocation`
    },
    
    // Metadata
    businessContext: {
      sql: `business_context`,
      type: `string`,
      description: `Context under which the item was created`
    },
    
    sourceDomain: {
      sql: `source_domain`,
      type: `string`,
      description: `Source domain of the data`
    },
    
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who created the item`
    },
    
    createdByUserId: {
      sql: `created_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Created By User ID`,
      description: `ID of the user who created the item`
    },
    
    createdAt: {
      sql: `created_at`,
      type: `time`,
      description: `Timestamp when the item was created`
    },
    
    updatedBy: {
      sql: `(updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who last updated the item`
    },
    
    updatedByUserId: {
      sql: `updated_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Updated By User ID`,
      description: `ID of the user who last updated the item`
    },
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      description: `Timestamp when the item was last updated`
    },
    
    // Boolean flags
    isSubmittedOnce: {
      sql: `is_submitted_once`,
      type: `boolean`,
      description: `Flag indicating if the item was submitted at least once`
    },
    
    isContingent: {
      sql: `is_contingent`,
      type: `boolean`,
      description: `Flag indicating if the item is contingent`
    },
    
    isActive: {
      sql: `is_active`,
      type: `boolean`,
      description: `Flag indicating if the item is currently active`
    },
    
    lastSubmissionId: {
      sql: `last_submission_id`,
      type: `string`,
      description: `ID of the last submission containing this item`
    }
  }
});
