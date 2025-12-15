// Cube.js schema for Material RFQ Document Items
// Maps to: public.material_rfq_document_item

cube(`MaterialRfqDocumentItem`, {
  sql: `SELECT * FROM public.material_rfq_document_item`,
  
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
      drillMembers: [name, materialNumber, documentHeaderId]
    },
    
    totalQuantity: {
      sql: `quantity`,
      type: `sum`,
      format: `number`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`
    },
    
    avgUnitPrice: {
      sql: `unit_price`,
      type: `avg`,
      format: `currency`
    },
    
    minUnitPrice: {
      sql: `unit_price`,
      type: `min`,
      format: `currency`,
      title: `Lowest Unit Price`
    },
    
    maxUnitPrice: {
      sql: `unit_price`,
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
    
    documentHeaderId: {
      sql: `document_header_id`,
      type: `string`
    },
    
    lineItemId: {
      sql: `line_item_id`,
      type: `string`
    },
    
    rootId: {
      sql: `root_id`,
      type: `string`
    },
    
    // Item identification
    name: {
      sql: `name`,
      type: `string`,
      title: `Item Name`
    },
    
    longDescription: {
      sql: `long_description`,
      type: `string`
    },
    
    documentTitleId: {
      sql: `document_title_id`,
      type: `string`
    },
    
    hierarchyNumber: {
      sql: `hierarchy_number`,
      type: `string`
    },
    
    // Material fields
    materialNumber: {
      sql: `material_number`,
      type: `string`,
      title: `Material Number`
    },
    
    materialGroup: {
      sql: `material_group::jsonb->>'Code'`,
      type: `string`,
      title: `Material Group`
    },
    
    materialGroupName: {
      sql: `material_group::jsonb->>'Name'`,
      type: `string`,
      title: `Material Group Name`
    },
    
    productType: {
      sql: `product_type`,
      type: `string`
    },
    
    // Source document
    sourceDocumentNumber: {
      sql: `source_document_number`,
      type: `string`
    },
    
    sourceDocumentItemNumber: {
      sql: `source_document_item_number`,
      type: `string`
    },
    
    // Purchasing data
    plant: {
      sql: `plant::jsonb->>'Code'`,
      type: `string`
    },
    
    plantName: {
      sql: `plant::jsonb->>'Name'`,
      type: `string`,
      title: `Plant Name`
    },
    
    purchaseGroup: {
      sql: `purchase_group::jsonb->>'Code'`,
      type: `string`
    },
    
    purchaseGroupName: {
      sql: `purchase_group::jsonb->>'Name'`,
      type: `string`,
      title: `Purchase Group Name`
    },
    
    purchasingDocument: {
      sql: `purchasing_document`,
      type: `string`
    },
    
    // Quantity and pricing
    quantity: {
      sql: `quantity`,
      type: `number`,
      title: `Quantity`
    },
    
    priceQuantity: {
      sql: `price_quantity`,
      type: `number`
    },
    
    unitPrice: {
      sql: `unit_price`,
      type: `number`,
      format: `currency`
    },
    
    totalPriceValue: {
      sql: `total_price`,
      type: `number`,
      format: `currency`
    },
    
    // Units
    baseUnit: {
      sql: `base_unit`,
      type: `string`,
      title: `Base Unit`
    },
    
    priceUnit: {
      sql: `price_unit`,
      type: `string`
    },
    
    currency: {
      sql: `currency`,
      type: `string`
    },
    
    // Delivery
    deliveryDateCategory: {
      sql: `delivery_date_category`,
      type: `string`
    },
    
    deliveryDate: {
      sql: `delivery_date`,
      type: `time`,
      title: `Delivery Date`
    },
    
    deliveryAddress: {
      sql: `delivery_address::jsonb->>'FullName'`,
      type: `string`
    },
    
    deliveryAddressCity: {
      sql: `delivery_address::jsonb->'Address'->>'City'`,
      type: `string`,
      title: `Delivery City`
    },
    
    deliveryAddressStreet: {
      sql: `delivery_address::jsonb->'Address'->>'Street'`,
      type: `string`,
      title: `Delivery Street`
    },
    
    deliveryAddressPostalCode: {
      sql: `delivery_address::jsonb->'Address'->>'PostalCode'`,
      type: `string`,
      title: `Delivery Postal Code`
    },
    
    // Item classification
    itemCategory: {
      sql: `item_category`,
      type: `string`
    },
    
    itemSource: {
      sql: `item_source`,
      type: `string`
    },
    
    itemType: {
      sql: `item_type`,
      type: `string`
    },
    
    parentType: {
      sql: `parent_type`,
      type: `string`
    },
    
    depth: {
      sql: `depth`,
      type: `number`
    },
    
    sequenceNumber: {
      sql: `sequence_number`,
      type: `number`
    },
    
    // Allocation
    allocationGroupNumber: {
      sql: `allocation_group_number`,
      type: `string`
    },
    
    allocationSerialNumber: {
      sql: `allocation_serial_number`,
      type: `string`
    },
    
    // Metadata
    businessContext: {
      sql: `business_context`,
      type: `string`
    },
    
    sourceDomain: {
      sql: `source_domain`,
      type: `string`
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
    
    createdAt: {
      sql: `created_at`,
      type: `time`
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
    
    // Boolean flags
    isSubmittedOnce: {
      sql: `is_submitted_once`,
      type: `boolean`
    },
    
    isContingent: {
      sql: `is_contingent`,
      type: `boolean`
    },
    
    isActive: {
      sql: `is_active`,
      type: `boolean`
    },
    
    lastSubmissionId: {
      sql: `last_submission_id`,
      type: `string`
    }
  }
});
