// Cube.js schema for Request For To Supplier (RFQ Suppliers)
// Maps to: buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq

cube(`RequestForToSupplierMaterialRfq`, {
  sql: `SELECT * FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq`,
  
  preAggregations: {
    bySupplier: {
      measures: [
        RequestForToSupplierMaterialRfq.count,
        RequestForToSupplierMaterialRfq.activeCount,
        RequestForToSupplierMaterialRfq.inactiveCount
      ],
      dimensions: [
        RequestForToSupplierMaterialRfq.supplierContact,
        RequestForToSupplierMaterialRfq.currentStateId
      ],
      timeDimension: RequestForToSupplierMaterialRfq.createdAt,
      granularity: `month`
    }
  },

  joins: {
    MaterialRfq: {
      sql: `${CUBE}.parent_id = ${MaterialRfq}.id`,
      relationship: `belongsTo`
    },
    StateRequestForToSupplierMaterialRfq: {
      sql: `${CUBE}.current_state_id = ${StateRequestForToSupplierMaterialRfq}.id`,
      relationship: `belongsTo`
    },
    Quotation: {
      sql: `${CUBE}.id = ${Quotation}.request_for_to_supplier_id`,
      relationship: `hasMany`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [supplierContact, parentId, createdAt],
      title: `Total Invited Suppliers`
    },
    
    activeCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.is_active = true` }],
      title: `Active Suppliers Count`
    },
    
    inactiveCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.is_active = false` }],
      title: `Rejected Suppliers Count`
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true
    },
    
    parentId: {
      sql: `parent_id`,
      type: `string`,
      title: `RFQ ID`
    },
    
    lineItemId: {
      sql: `line_item_id`,
      type: `string`
    },
    
    supplierContact: {
      sql: `request_for_to_supplier_contact::jsonb->>'SupplierName'`,
      type: `string`,
      title: `Supplier Contact`
    },
    
    supplierEmail: {
      sql: `request_for_to_supplier_contact::jsonb->>'SupplierEmailAddress'`,
      type: `string`,
      title: `Supplier Email`
    },
    
    supplierAddressId: {
      sql: `request_for_to_supplier_contact::jsonb->>'AddressBookEntryId'`,
      type: `string`,
      title: `Supplier Address Book ID`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Current State`
    },
    
    cancellationReason: {
      sql: `cancellation_reason`,
      type: `string`
    },
    
    lastStateChangedRound: {
      sql: `last_state_changed_round_number`,
      type: `number`,
      title: `Last State Changed Round`
    },
    
    // Metadata
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
    isActive: {
      sql: `is_active`,
      type: `boolean`,
      title: `Is Active`
    },
    
    hasActiveStatusChanged: {
      sql: `has_active_status_changed`,
      type: `boolean`,
      title: `Has Viewed/Responded`
    }
  }
});
