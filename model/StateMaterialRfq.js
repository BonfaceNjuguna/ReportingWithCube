// Cube.js schema for Material RFQ States
// Maps to: buyer_d_fdw_rfq_service.state_material_rfq

cube(`StateMaterialRfq`, {
  sql: `SELECT * FROM buyer_d_fdw_rfq_service.state_material_rfq`,
  
  measures: {
    count: {
      type: `count`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true
    },
    
    ownerId: {
      sql: `owner_id`,
      type: `string`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `State Name`
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
    }
  }
});
