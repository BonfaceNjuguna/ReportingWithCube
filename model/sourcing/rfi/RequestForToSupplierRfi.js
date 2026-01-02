// Cube.js schema for RFI Supplier Invitations
// Maps to: buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information

cube(`RequestForToSupplierRfi`, {
  sql: `SELECT * FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information`,
  
  joins: {
    RequestForInformation: {
      sql: `${CUBE}.parent_id = ${RequestForInformation}.id`,
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
      title: `Total Invited Suppliers (RFI)`,
      description: `Total number of supplier invitations for RFIs`
    },
    
    activeCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.is_active = true` }],
      title: `Active Suppliers Count`,
      description: `Number of active supplier invitations`
    },
    
    inactiveCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.is_active = false` }],
      title: `Rejected Suppliers Count`,
      description: `Number of inactive or rejected supplier invitations`
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the supplier invitation`
    },
    
    parentId: {
      sql: `parent_id`,
      type: `string`,
      title: `RFI ID`,
      description: `Reference to the parent RFI ID`
    },
    
    lineItemId: {
      sql: `line_item_id`,
      type: `string`,
      description: `Reference to a specific line item, if applicable`
    },
    
    supplierContact: {
      sql: `request_for_to_supplier_contact::jsonb->>'SupplierName'`,
      type: `string`,
      title: `Supplier Contact`,
      description: `Name of the supplier contact person`
    },
    
    supplierEmail: {
      sql: `request_for_to_supplier_contact::jsonb->>'SupplierEmailAddress'`,
      type: `string`,
      title: `Supplier Email`,
      description: `Email address of the supplier contact`
    },
    
    supplierAddressId: {
      sql: `request_for_to_supplier_contact::jsonb->>'AddressBookEntryId'`,
      type: `string`,
      title: `Supplier Address Book ID`,
      description: `Reference to the supplier's address book entry`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Current State`,
      description: `ID of the current status of the invitation`
    },
    
    cancellationReason: {
      sql: `cancellation_reason`,
      type: `string`,
      description: `Reason for cancellation, if applicable`
    },
    
    lastStateChangedRound: {
      sql: `last_state_changed_round_number`,
      type: `number`,
      title: `Last State Changed Round`,
      description: `The RFQ round number when the state last changed`
    },
    
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who created the invitation`
    },
    
    createdByUserId: {
      sql: `created_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Created By User ID`,
      description: `ID of the user who created the invitation`
    },
    
    createdAt: {
      sql: `created_at`,
      type: `time`,
      description: `Timestamp when the invitation was created`
    },
    
    updatedBy: {
      sql: `(updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who last updated the invitation`
    },
    
    updatedByUserId: {
      sql: `updated_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Updated By User ID`,
      description: `ID of the user who last updated the invitation`
    },
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      description: `Timestamp when the invitation was last updated`
    },
    
    isActive: {
      sql: `is_active`,
      type: `boolean`,
      title: `Is Active`,
      description: `Flag indicating if the invitation is currently active`
    },
    
    hasActiveStatusChanged: {
      sql: `has_active_status_changed`,
      type: `boolean`,
      title: `Has Viewed/Responded`,
      description: `Flag indicating if the supplier has viewed or responded to the RFI`
    }
  }
});
