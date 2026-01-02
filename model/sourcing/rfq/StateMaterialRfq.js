// Cube.js schema for Material RFQ States
// Maps to: buyer_d_fdw_rfq_service.state_material_rfq

cube(`StateMaterialRfq`, {
  sql: `SELECT * FROM buyer_d_fdw_rfq_service.state_material_rfq`,
  
  measures: {
    count: {
      type: `count`,
      description: `Total number of Material RFQ states`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the RFQ state`
    },
    
    ownerId: {
      sql: `owner_id`,
      type: `string`,
      description: `ID of the owner of this state`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `State Name`,
      description: `Human-readable name of the RFQ state`
    },
    
    createdBy: {
      sql: `(created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who created the state`
    },
    
    createdByUserId: {
      sql: `created_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Created By User ID`,
      description: `ID of the user who created the state`
    },
    
    createdAt: {
      sql: `created_at`,
      type: `time`,
      description: `Timestamp when the state was created`
    },
    
    updatedBy: {
      sql: `(updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName')`,
      type: `string`,
      description: `Name of the user who last updated the state`
    },
    
    updatedByUserId: {
      sql: `updated_by::jsonb->>'UserId'`,
      type: `string`,
      title: `Updated By User ID`,
      description: `ID of the user who last updated the state`
    },
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      description: `Timestamp when the state was last updated`
    }
  }
});
